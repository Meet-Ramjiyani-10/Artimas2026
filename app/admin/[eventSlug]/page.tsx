'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import '../admin.css';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

interface Member {
  name?: string;
  email?: string;
  phone?: string;
  college?: string;
  year?: string;
  branch?: string;
}

interface RegistrationItem {
  _id: string;
  registrationId: string;
  eventName: string;
  eventSlug?: string;
  teamName?: string;
  leadName: string;
  leadEmail: string;
  leadPhone: string;
  leadCollege: string;
  isPccoe: boolean;
  amount: number;
  transactionId?: string;
  screenshotUrl?: string;
  status: string;
  verified?: boolean;
  verifiedAt?: string;
  confirmationEmailSentAt?: string | null;
  verificationEmailSentAt?: string | null;
  confirmationEmailLastError?: string | null;
  verificationEmailLastError?: string | null;
  members?: Member[];
  createdAt: string;
  updatedAt: string;
}

interface AdminProfile {
  id: string;
  name: string;
  username?: string;
  email: string;
  role: 'MASTER_ADMIN' | 'ADMIN' | 'TECH_TEAM' | 'EVENT_ADMIN';
  eventId?: string | null;
  eventSlug?: string | null;
  eventName?: string | null;
}

interface EventStats {
  total: number;
  verified: number;
  unverified: number;
  totalTeams: number;
  eventName?: string;
  eventSlug?: string;
}

// Map event slug to standard display names
const SLUG_TO_NAME: Record<string, string> = {
  'datathon': 'Datathon',
  'pixel-perfect': 'Surprise Event',
  'surprise-event': 'Surprise Event',
  'prompt-relay': 'Prompt Relay',
  'brandathon': 'Brandathon',
  'capture-the-flag': 'Capture the Flag (CTF)',
  'houdini-heist': 'Houdini Heist',
  'among-us': 'Among Us',
  'hackmatrix': 'HackMatrix',
};

export default function EventAdminPortal() {
  const params = useParams();
  const router = useRouter();
  const eventSlug = (params?.eventSlug as string || '').toLowerCase();
  const eventDisplayName = SLUG_TO_NAME[eventSlug] || eventSlug.replace(/-/g, ' ').toUpperCase();

  const [token, setToken] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<AdminProfile | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

  // Login form state
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginUsername, setLoginUsername] = useState<string>(eventSlug);
  const [loginError, setLoginError] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Dashboard state
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [verificationFilter, setVerificationFilter] = useState<'ALL' | 'VERIFIED' | 'UNVERIFIED'>('ALL');
  const [viewMode, setViewMode] = useState<'auto' | 'cards' | 'table'>('auto');
  const [selectedRegistration, setSelectedRegistration] = useState<RegistrationItem | null>(null);

  // Confirmation dialog for Unverify & Verify
  const [unverifyTarget, setUnverifyTarget] = useState<RegistrationItem | null>(null);
  const [verifyTarget, setVerifyTarget] = useState<RegistrationItem | null>(null);
  const [resendingEmailId, setResendingEmailId] = useState<string | null>(null);

  // 1. Initial auth check
  useEffect(() => {
    const savedToken = typeof window !== 'undefined' ? sessionStorage.getItem('artimas_admin_token') : null;
    const savedUserStr = typeof window !== 'undefined' ? sessionStorage.getItem('artimas_admin_user') : null;

    if (savedToken) {
      setToken(savedToken);
      if (savedUserStr) {
        try {
          setAdminUser(JSON.parse(savedUserStr));
        } catch {}
      }
    }
    setIsCheckingAuth(false);
  }, []);

  // Is Master Admin?
  const isMaster = useMemo(() => {
    if (!adminUser) return false;
    return ['MASTER_ADMIN', 'ADMIN', 'TECH_TEAM'].includes(adminUser.role);
  }, [adminUser]);

  // Is Authorized for this event?
  const isAuthorizedForThisEvent = useMemo(() => {
    if (!adminUser) return false;
    if (isMaster) return true;
    if (adminUser.role === 'EVENT_ADMIN') {
      return adminUser.eventSlug?.toLowerCase() === eventSlug;
    }
    return false;
  }, [adminUser, isMaster, eventSlug]);

  // 2. Fetch event registrations and stats
  const fetchData = useCallback(async (authToken: string) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const cacheBust = Date.now();
      const headers = {
        Authorization: `Bearer ${authToken}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      };

      const [regsRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/admin/registrations?eventSlug=${eventSlug}&limit=1000&_t=${cacheBust}`, { headers, cache: 'no-store' }),
        fetch(`${API_BASE}/admin/stats?_t=${cacheBust}`, { headers, cache: 'no-store' }),
      ]);

      if (regsRes.status === 401 || regsRes.status === 403) {
        if (regsRes.status === 403) {
          setErrorMessage(`Access Forbidden: You are not authorized to view registrations for ${eventDisplayName}`);
        } else {
          sessionStorage.removeItem('artimas_admin_token');
          sessionStorage.removeItem('artimas_admin_user');
          setToken(null);
          setAdminUser(null);
          setLoginError('Session expired. Please log in again.');
        }
        return;
      }

      const [regsJson, statsJson] = await Promise.all([
        regsRes.json(),
        statsRes.json(),
      ]);

      if (regsJson.success && Array.isArray(regsJson.data)) {
        setRegistrations(regsJson.data);
      }

      if (statsJson.success && statsJson.data) {
        if (statsJson.data.totalTeams !== undefined) {
          // Event-scoped stats returned directly
          setStats(statsJson.data);
        } else if (statsJson.data.byEvent) {
          // Master Admin view: find this event in byEvent
          const evData = statsJson.data.byEvent.find(
            (e: { eventSlug: string; eventName: string }) =>
              e.eventSlug?.toLowerCase() === eventSlug ||
              e.eventName?.toLowerCase() === eventDisplayName.toLowerCase()
          );
          if (evData) {
            setStats({
              total: evData.count,
              verified: evData.verified ?? evData.approved ?? 0,
              unverified: evData.unverified ?? 0,
              totalTeams: regsJson.data?.filter((r: RegistrationItem) => r.teamName || (r.members && r.members.length > 1)).length || 0,
              eventName: evData.eventName,
              eventSlug: evData.eventSlug,
            });
          }
        }
      }
    } catch {
      setErrorMessage('Unable to connect to backend service. Ensure server is running.');
    } finally {
      setIsLoading(false);
    }
  }, [eventSlug, eventDisplayName]);

  useEffect(() => {
    if (token && isAuthorizedForThisEvent) {
      fetchData(token);
    }
  }, [token, isAuthorizedForThisEvent, fetchData]);

  // 3. Login submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginPassword.trim()) {
      setLoginError('Please enter password');
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginUsername.trim(),
          password: loginPassword.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setLoginError(json.message || 'Invalid credentials');
        return;
      }

      const receivedToken = json.data?.token;
      const user = json.data?.admin;

      if (receivedToken && user) {
        sessionStorage.setItem('artimas_admin_token', receivedToken);
        sessionStorage.setItem('artimas_admin_user', JSON.stringify(user));
        setToken(receivedToken);
        setAdminUser(user);
        setLoginPassword('');

        // If an event admin logged in for a different event, redirect to their assigned event
        if (user.role === 'EVENT_ADMIN' && user.eventSlug && user.eventSlug !== eventSlug) {
          router.push(`/admin/${user.eventSlug}`);
        }
      } else {
        setLoginError('Authentication failed: Missing token or user data');
      }
    } catch {
      setLoginError('Unable to connect to backend service');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // 4. Logout
  const handleLogout = () => {
    sessionStorage.removeItem('artimas_admin_token');
    sessionStorage.removeItem('artimas_admin_user');
    setToken(null);
    setAdminUser(null);
    setRegistrations([]);
    setStats(null);
    setLoginPassword('');
    setLoginError('');
  };

  // 5. Verify a participant
  const handleVerify = async (reg: RegistrationItem) => {
    if (!token) return;
    setActionLoadingId(reg._id);

    try {
      const res = await fetch(`${API_BASE}/admin/registrations/${reg.registrationId}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ remarks: `Verified by ${adminUser?.name || 'Admin'}` }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        // Update UI state immediately
        setRegistrations((prev) =>
          prev.map((r) =>
            r._id === reg._id
              ? {
                  ...r,
                  verified: true,
                  status: 'APPROVED',
                  verificationEmailSentAt: json.data?.verificationEmailSentAt || r.verificationEmailSentAt,
                  verificationEmailLastError: json.data?.verificationEmailLastError,
                }
              : r
          )
        );
        if (selectedRegistration && selectedRegistration._id === reg._id) {
          setSelectedRegistration((prev) =>
            prev
              ? {
                  ...prev,
                  verified: true,
                  status: 'APPROVED',
                  verificationEmailSentAt: json.data?.verificationEmailSentAt || prev.verificationEmailSentAt,
                  verificationEmailLastError: json.data?.verificationEmailLastError,
                }
              : null
          );
        }
        // Increment verified count in stats
        setStats((prev) => prev ? {
          ...prev,
          verified: prev.verified + 1,
          unverified: Math.max(prev.unverified - 1, 0),
        } : null);
      } else {
        alert(json.message || 'Failed to verify participant');
      }
    } catch {
      alert('Network error while verifying participant');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Resend verification email
  const handleResendVerificationEmail = async (reg: RegistrationItem) => {
    if (!token) return;
    setResendingEmailId(reg._id);

    try {
      const res = await fetch(`${API_BASE}/admin/registrations/${reg.registrationId}/resend-verification-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();
      if (res.ok && json.success) {
        const now = json.data?.verificationEmailSentAt || new Date().toISOString();
        setRegistrations((prev) =>
          prev.map((r) =>
            r._id === reg._id
              ? {
                  ...r,
                  verificationEmailSentAt: now,
                  verificationEmailLastError: null,
                }
              : r
          )
        );
        if (selectedRegistration && selectedRegistration._id === reg._id) {
          setSelectedRegistration((prev) =>
            prev
              ? {
                  ...prev,
                  verificationEmailSentAt: now,
                  verificationEmailLastError: null,
                }
              : null
          );
        }
        alert(`✓ Verification email resent successfully to ${reg.leadEmail}`);
      } else {
        const errMsg = json.message || 'Failed to resend verification email';
        alert(errMsg);
        if (json.data?.verificationEmailLastError) {
          setRegistrations((prev) =>
            prev.map((r) =>
              r._id === reg._id
                ? {
                    ...r,
                    verificationEmailLastError: json.data.verificationEmailLastError,
                  }
                : r
            )
          );
        }
      }
    } catch {
      alert('Network error while resending verification email');
    } finally {
      setResendingEmailId(null);
    }
  };

  // 6. Unverify a participant (after confirmation)
  const handleConfirmUnverify = async () => {
    if (!token || !unverifyTarget) return;
    const reg = unverifyTarget;
    setActionLoadingId(reg._id);
    setUnverifyTarget(null);

    try {
      const res = await fetch(`${API_BASE}/admin/registrations/${reg.registrationId}/unverify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ remarks: 'Verification undone by admin' }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        // Update UI state immediately
        setRegistrations((prev) =>
          prev.map((r) =>
            r._id === reg._id ? { ...r, verified: false, status: 'CONFIRMED' } : r
          )
        );
        // Decrement verified count in stats
        setStats((prev) => prev ? {
          ...prev,
          verified: Math.max(prev.verified - 1, 0),
          unverified: prev.unverified + 1,
        } : null);
      } else {
        alert(json.message || 'Failed to unverify participant');
      }
    } catch {
      alert('Network error while unverifying participant');
    } finally {
      setActionLoadingId(null);
    }
  };

  // 7. Server-side Verified CSV Export
  const handleExportVerifiedCsv = () => {
    if (!token) return;
    const verifiedCount = registrations.filter((r) => r.verified || r.status === 'APPROVED').length;
    if (verifiedCount === 0) {
      alert(`No verified participants to export for ${eventDisplayName}.`);
      return;
    }

    const url = `${API_BASE}/admin/export/verified-csv?eventSlug=${eventSlug}&_t=${Date.now()}`;
    // Trigger download with auth token
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Failed to export CSV');
        }
        return res.blob();
      })
      .then((blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `ARTIMAS26_Verified_${eventSlug.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
      })
      .catch((err) => {
        alert(`Export failed: ${err.message}`);
      });
  };

  // 8. Filtered registrations
  const filteredRegistrations = useMemo(() => {
    return registrations.filter((reg) => {
      const isVerified = reg.verified === true || reg.status === 'APPROVED';

      // Verification filter
      if (verificationFilter === 'VERIFIED' && !isVerified) return false;
      if (verificationFilter === 'UNVERIFIED' && isVerified) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const pool = [
          reg.registrationId,
          reg.teamName,
          reg.leadName,
          reg.leadEmail,
          reg.leadPhone,
          reg.leadCollege,
          reg.transactionId,
          ...(reg.members || []).flatMap((m) => [m.name, m.email, m.phone, m.college, m.year, m.branch]),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!pool.includes(q)) return false;
      }

      return true;
    });
  }, [registrations, verificationFilter, searchQuery]);

  if (isCheckingAuth) return null;

  // ── 1. LOGIN VIEW ──
  if (!token) {
    return (
      <div className="admin-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div
          style={{
            width: '100%',
            maxWidth: '420px',
            backgroundColor: '#111722',
            border: '1px solid #1e293b',
            borderRadius: '10px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            padding: '28px 22px',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '2px', color: '#f8fafc', margin: '0 0 6px' }}>
              ARTIMAS 26
            </h1>
            <p style={{ fontSize: '14px', color: '#38bdf8', fontWeight: 600, margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>
              {eventDisplayName} Admin Portal
            </p>
            <div style={{ marginTop: '10px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: '#1e293b',
                  color: '#94a3b8',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  letterSpacing: '0.5px',
                }}
              >
                EVENT ADMIN ACCESS
              </span>
            </div>
          </div>

          <form onSubmit={handleLogin} noValidate>
            <div style={{ marginBottom: '16px' }}>
              <label
                htmlFor="admin-username"
                style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px', letterSpacing: '0.5px' }}
              >
                USERNAME / EMAIL
              </label>
              <input
                id="admin-username"
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="Enter username or email"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '12px 14px',
                  backgroundColor: '#0a0d12',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '16px', // Prevents auto-zoom on iOS
                  minHeight: '44px',
                  outline: 'none',
                }}
                required
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label
                htmlFor="admin-password"
                style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px', letterSpacing: '0.5px' }}
              >
                PASSWORD
              </label>
              <input
                id="admin-password"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter password"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '12px 14px',
                  backgroundColor: '#0a0d12',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '16px', // Prevents auto-zoom on iOS
                  minHeight: '44px',
                  outline: 'none',
                }}
                required
                autoFocus
              />
            </div>

            {loginError && (
              <div
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  color: '#f87171',
                  fontSize: '13px',
                  marginBottom: '18px',
                }}
              >
                ⚠ {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              style={{
                width: '100%',
                padding: '12px',
                minHeight: '44px',
                backgroundColor: '#2563eb',
                border: 'none',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 600,
                letterSpacing: '0.5px',
                cursor: isLoggingIn ? 'not-allowed' : 'pointer',
                opacity: isLoggingIn ? 0.7 : 1,
              }}
            >
              {isLoggingIn ? 'AUTHENTICATING...' : 'ENTER DASHBOARD'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── 2. UNAUTHORIZED / CROSS-EVENT FORBIDDEN VIEW ──
  if (!isAuthorizedForThisEvent) {
    return (
      <div className="admin-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div
          style={{
            maxWidth: '480px',
            width: '100%',
            backgroundColor: '#111722',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '10px',
            padding: '28px 20px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>🚫</div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#f87171', margin: '0 0 8px' }}>
            Access Restricted (403)
          </h2>
          <p style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: '1.5', margin: '0 0 20px' }}>
            You are logged in as <strong>{adminUser?.name || adminUser?.username}</strong>.
            You only have authorization to manage <strong>{adminUser?.eventName || adminUser?.eventSlug}</strong>.
          </p>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {adminUser?.eventSlug && (
              <button
                type="button"
                onClick={() => router.push(`/admin/${adminUser.eventSlug}`)}
                style={{
                  padding: '10px 18px',
                  backgroundColor: '#2563eb',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  minHeight: '42px',
                }}
              >
                Go to {adminUser.eventName || adminUser.eventSlug} Dashboard
              </button>
            )}
            <button
              type="button"
              onClick={handleLogout}
              style={{
                padding: '10px 18px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#cbd5e1',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                minHeight: '42px',
              }}
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate live counts
  const totalCount = stats?.total ?? registrations.length;
  const verifiedCount = stats?.verified ?? registrations.filter((r) => r.verified || r.status === 'APPROVED').length;
  const unverifiedCount = stats?.unverified ?? registrations.filter((r) => !r.verified && r.status !== 'APPROVED').length;
  const totalTeamsCount = stats?.totalTeams ?? registrations.filter((r) => r.teamName || (r.members && r.members.length > 1)).length;

  // ── 3. EVENT ADMIN DASHBOARD ──
  return (
    <div className="admin-container">
      <div className="admin-wrapper">
        {/* Top Header */}
        <div className="admin-header">
          <div className="admin-header-title-area">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '1px', color: '#f8fafc', margin: 0 }}>
                ARTIMAS 26
              </h1>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  color: '#38bdf8',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  letterSpacing: '0.5px',
                }}
              >
                EVENT ADMIN · {eventDisplayName.toUpperCase()}
              </span>
              {isMaster && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    backgroundColor: 'rgba(234, 179, 8, 0.15)',
                    border: '1px solid rgba(234, 179, 8, 0.4)',
                    color: '#facc15',
                    padding: '3px 8px',
                    borderRadius: '6px',
                  }}
                >
                  MASTER VIEW
                </span>
              )}
            </div>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0' }}>
              {eventDisplayName} Participant Management & Verification Portal
            </p>
          </div>

          <div className="admin-header-actions">
            {isMaster && (
              <button
                type="button"
                onClick={() => router.push('/admin')}
                style={{
                  padding: '9px 15px',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#cbd5e1',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  minHeight: '38px',
                }}
              >
                ← Master Admin
              </button>
            )}

            <button
              type="button"
              onClick={() => fetchData(token)}
              disabled={isLoading}
              style={{
                padding: '9px 15px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#cbd5e1',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                minHeight: '38px',
              }}
            >
              {isLoading ? 'REFRESHING...' : '↻ REFRESH'}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              style={{
                padding: '9px 15px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '6px',
                color: '#f87171',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                minHeight: '38px',
              }}
            >
              LOGOUT
            </button>
          </div>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '6px',
              padding: '12px 16px',
              color: '#f87171',
              fontSize: '14px',
              marginBottom: '20px',
            }}
          >
            ⚠ {errorMessage}
          </div>
        )}

        {/* ── Key Metrics Cards Banner (2-column on mobile, row on desktop) ── */}
        <div className="admin-metrics-grid">
          <div className="admin-metric-card">
            <span className="admin-metric-label">Total Registrations</span>
            <div className="admin-metric-value" style={{ color: '#f8fafc' }}>
              {totalCount}
            </div>
          </div>

          <div className="admin-metric-card">
            <span className="admin-metric-label">Verified</span>
            <div className="admin-metric-value" style={{ color: '#22c55e' }}>
              {verifiedCount}
            </div>
          </div>

          <div className="admin-metric-card">
            <span className="admin-metric-label">Unverified</span>
            <div className="admin-metric-value" style={{ color: '#f59e0b' }}>
              {unverifiedCount}
            </div>
          </div>

          <div className="admin-metric-card">
            <span className="admin-metric-label">Total Teams</span>
            <div className="admin-metric-value" style={{ color: '#60a5fa' }}>
              {totalTeamsCount}
            </div>
          </div>
        </div>

        {/* ── Search & Filter Controls ── */}
        <div className="admin-filters-card">
          <div className="admin-filters-inputs">
            {/* Search Input */}
            <div className="admin-search-wrapper">
              <span className="admin-search-icon">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by ID, team, lead, email, phone, college..."
                className="admin-search-input"
              />
            </div>

            {/* Verification Status Filter Pills */}
            <div className="admin-filter-pills">
              {(['ALL', 'VERIFIED', 'UNVERIFIED'] as const).map((statusKey) => (
                <button
                  key={statusKey}
                  type="button"
                  onClick={() => setVerificationFilter(statusKey)}
                  className={`admin-filter-pill-btn ${verificationFilter === statusKey ? 'active' : ''}`}
                >
                  {statusKey === 'ALL' && `All (${registrations.length})`}
                  {statusKey === 'VERIFIED' && `Verified (${verifiedCount})`}
                  {statusKey === 'UNVERIFIED' && `Unverified (${unverifiedCount})`}
                </button>
              ))}
            </div>
          </div>

          {/* Export Verified CSV Button */}
          <div className="admin-export-group">
            <button
              type="button"
              onClick={handleExportVerifiedCsv}
              className="admin-btn-export-verified"
            >
              📥 EXPORT VERIFIED CSV ({verifiedCount})
            </button>
          </div>
        </div>

        {/* View Switcher & Counter Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ fontSize: '13px', color: '#94a3b8' }}>
            Showing <strong style={{ color: '#f8fafc' }}>{filteredRegistrations.length}</strong> of {registrations.length} attendees
          </div>
          <div className="admin-view-toggle">
            <button
              type="button"
              className={`admin-view-toggle-btn ${viewMode === 'auto' ? 'active' : ''}`}
              onClick={() => setViewMode('auto')}
              title="Auto (Cards on phone, Table on desktop)"
            >
              📱 Auto
            </button>
            <button
              type="button"
              className={`admin-view-toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => setViewMode('cards')}
              title="Force Card View"
            >
              🗂️ Cards
            </button>
            <button
              type="button"
              className={`admin-view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Force Table View"
            >
              📋 Table
            </button>
          </div>
        </div>

        {/* ── Registrations Data Views ── */}
        {isLoading && registrations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
            Loading {eventDisplayName} registrations...
          </div>
        ) : filteredRegistrations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8', backgroundColor: '#111722', borderRadius: '8px', border: '1px solid #1e293b' }}>
            No registrations found matching your filters.
          </div>
        ) : (
          <>
            {/* 1. DESKTOP TABLE VIEW */}
            <div className={viewMode === 'cards' ? 'desktop-only-view' : viewMode === 'auto' ? 'desktop-only-view admin-table-card' : 'admin-table-card'}>
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>REG ID</th>
                    <th>TEAM NAME</th>
                    <th>TEAM LEAD</th>
                    <th>CONTACT</th>
                    <th>COLLEGE</th>
                    <th>MEMBERS</th>
                    <th>VERIFICATION & EMAIL STATUS</th>
                    <th style={{ textAlign: 'center' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRegistrations.map((reg) => {
                    const isVerified = reg.verified === true || reg.status === 'APPROVED';
                    const isActionBusy = actionLoadingId === reg._id;

                    return (
                      <tr key={reg._id}>
                        {/* REG ID */}
                        <td style={{ fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap' }}>
                          <span
                            style={{
                              backgroundColor: '#1e293b',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontFamily: 'monospace',
                            }}
                          >
                            {reg.registrationId}
                          </span>
                        </td>

                        {/* TEAM NAME */}
                        <td style={{ fontWeight: 600, color: '#f8fafc' }}>
                          {reg.teamName || reg.leadName || '—'}
                        </td>

                        {/* TEAM LEAD */}
                        <td style={{ color: '#e2e8f0' }}>
                          <div style={{ fontWeight: 600 }}>{reg.leadName}</div>
                        </td>

                        {/* CONTACT */}
                        <td style={{ color: '#94a3b8', fontSize: '12px' }}>
                          <div>
                            <a href={`tel:${reg.leadPhone}`} style={{ color: '#cbd5e1', textDecoration: 'none' }}>
                              {reg.leadPhone}
                            </a>
                          </div>
                          <div style={{ color: '#64748b', fontSize: '11px' }}>
                            <a href={`mailto:${reg.leadEmail}`} style={{ color: '#64748b', textDecoration: 'none' }}>
                              {reg.leadEmail}
                            </a>
                          </div>
                        </td>

                        {/* COLLEGE */}
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <span style={{ color: '#cbd5e1' }}>{reg.leadCollege || 'PCCOE'}</span>
                          {reg.isPccoe && (
                            <span
                              style={{
                                marginLeft: '6px',
                                fontSize: '10.5px',
                                fontWeight: 700,
                                color: '#22c55e',
                                backgroundColor: 'rgba(34, 197, 94, 0.15)',
                                padding: '2px 6px',
                                borderRadius: '3px',
                              }}
                            >
                              PCCOE FREE
                            </span>
                          )}
                        </td>

                        {/* MEMBERS */}
                        <td style={{ color: '#94a3b8', textAlign: 'center' }}>
                          <span
                            style={{
                              backgroundColor: '#0a0d12',
                              border: '1px solid #1e293b',
                              borderRadius: '12px',
                              padding: '2px 8px',
                              fontSize: '12px',
                              fontWeight: 600,
                            }}
                          >
                            {reg.members?.length || 1}
                          </span>
                        </td>

                        {/* VERIFICATION & EMAIL STATUS */}
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <div>
                              {isVerified ? (
                                <span className="admin-status-verified-badge">
                                  ✓ VERIFIED
                                </span>
                              ) : (
                                <span className="admin-status-unverified-badge">
                                  ● UNVERIFIED
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '11px' }}>
                              {isVerified ? (
                                reg.verificationEmailSentAt ? (
                                  <span style={{ color: '#4ade80', fontWeight: 600 }}>
                                    ✓ Verification email sent
                                  </span>
                                ) : reg.verificationEmailLastError ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ color: '#f87171', fontWeight: 600 }}>
                                      ⚠ Verification email failed
                                    </span>
                                    <button
                                      type="button"
                                      disabled={resendingEmailId === reg._id}
                                      onClick={() => handleResendVerificationEmail(reg)}
                                      style={{
                                        padding: '2px 6px',
                                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                        border: '1px solid rgba(239, 68, 68, 0.4)',
                                        borderRadius: '3px',
                                        color: '#fca5a5',
                                        fontSize: '10.5px',
                                        cursor: resendingEmailId === reg._id ? 'not-allowed' : 'pointer',
                                        fontWeight: 600,
                                      }}
                                    >
                                      {resendingEmailId === reg._id ? '...' : 'Resend Email'}
                                    </button>
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ color: '#94a3b8' }}>Not sent</span>
                                    <button
                                      type="button"
                                      disabled={resendingEmailId === reg._id}
                                      onClick={() => handleResendVerificationEmail(reg)}
                                      style={{
                                        padding: '2px 6px',
                                        backgroundColor: 'rgba(148, 163, 184, 0.15)',
                                        border: '1px solid rgba(148, 163, 184, 0.3)',
                                        borderRadius: '3px',
                                        color: '#cbd5e1',
                                        fontSize: '10.5px',
                                        cursor: resendingEmailId === reg._id ? 'not-allowed' : 'pointer',
                                        fontWeight: 600,
                                      }}
                                    >
                                      {resendingEmailId === reg._id ? '...' : 'Send Email'}
                                    </button>
                                  </div>
                                )
                              ) : reg.confirmationEmailSentAt ? (
                                <span style={{ color: '#60a5fa' }}>
                                  ✓ Confirmation email sent
                                </span>
                              ) : reg.confirmationEmailLastError ? (
                                <span style={{ color: '#fb923c' }}>
                                  ⚠ Confirmation email failed
                                </span>
                              ) : (
                                <span style={{ color: '#64748b' }}>
                                  Not sent
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* ACTION */}
                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            {isVerified ? (
                              <button
                                type="button"
                                disabled={isActionBusy}
                                onClick={() => setUnverifyTarget(reg)}
                                style={{
                                  padding: '5px 10px',
                                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  borderRadius: '4px',
                                  color: '#f87171',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  cursor: isActionBusy ? 'not-allowed' : 'pointer',
                                }}
                              >
                                UNVERIFY
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={isActionBusy}
                                onClick={() => setVerifyTarget(reg)}
                                style={{
                                  padding: '5px 12px',
                                  backgroundColor: '#166534',
                                  border: '1px solid #22c55e',
                                  borderRadius: '4px',
                                  color: '#ffffff',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  cursor: isActionBusy ? 'not-allowed' : 'pointer',
                                }}
                              >
                                {isActionBusy ? '...' : 'VERIFY'}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setSelectedRegistration(reg)}
                              style={{
                                padding: '5px 10px',
                                backgroundColor: '#1e293b',
                                border: '1px solid #334155',
                                borderRadius: '4px',
                                color: '#cbd5e1',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 2. MOBILE CARD VIEW */}
            <div className={viewMode === 'table' ? 'mobile-only-view' : viewMode === 'auto' ? 'mobile-only-view admin-cards-list' : 'admin-cards-list'}>
              {filteredRegistrations.map((reg) => {
                const isVerified = reg.verified === true || reg.status === 'APPROVED';
                const isActionBusy = actionLoadingId === reg._id;
                const cleanPhone = (reg.leadPhone || '').replace(/\D/g, '');

                return (
                  <div key={reg._id} className="admin-card-item">
                    {/* Top ID & Badges */}
                    <div className="admin-card-top">
                      <span className="admin-card-id-badge">
                        {reg.registrationId}
                      </span>
                      <div className="admin-card-status-row">
                        {isVerified ? (
                          <span className="admin-status-verified-badge">
                            ✓ VERIFIED
                          </span>
                        ) : (
                          <span className="admin-status-unverified-badge">
                            ● UNVERIFIED
                          </span>
                        )}
                        <span className={`admin-fee-badge ${reg.amount === 0 ? 'admin-fee-free' : 'admin-fee-paid'}`}>
                          {reg.amount === 0 ? '₹0 Free' : `₹${reg.amount}`}
                        </span>
                      </div>
                    </div>

                    {/* Team Name / Lead Name */}
                    <div className="admin-card-title">
                      {reg.teamName || reg.leadName}
                    </div>
                    {reg.teamName && reg.leadName && reg.teamName.toLowerCase() !== reg.leadName.toLowerCase() && (
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
                        Lead: <strong style={{ color: '#cbd5e1' }}>{reg.leadName}</strong>
                      </div>
                    )}

                    {/* College & Member tags */}
                    <div className="admin-card-event-line">
                      <span className="admin-card-college">
                        {reg.leadCollege || 'PCCOE'}
                      </span>
                      {reg.isPccoe && (
                        <span className="admin-pccoe-free-tag">
                          PCCOE FREE
                        </span>
                      )}
                      <span style={{ fontSize: '11px', color: '#64748b', marginLeft: 'auto' }}>
                        👥 {reg.members?.length || 1} {reg.members && reg.members.length > 1 ? 'members' : 'member'}
                      </span>
                    </div>

                    {/* Touch-friendly Contact Shortcuts */}
                    <div className="admin-card-contact-row">
                      <div className="admin-contact-item">
                        <a href={`tel:${reg.leadPhone}`} className="admin-contact-link">
                          📞 {reg.leadPhone}
                        </a>
                        {cleanPhone.length >= 10 && (
                          <a
                            href={`https://wa.me/91${cleanPhone.slice(-10)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="admin-contact-link"
                            style={{ color: '#22c55e', fontSize: '12px' }}
                          >
                            💬 WhatsApp
                          </a>
                        )}
                      </div>
                      {reg.leadEmail && (
                        <div className="admin-contact-item">
                          <a href={`mailto:${reg.leadEmail}`} className="admin-contact-link" style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                            ✉️ {reg.leadEmail}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Email Status in Card */}
                    <div style={{ margin: '8px 0 10px', fontSize: '11.5px' }}>
                      {isVerified ? (
                        reg.verificationEmailSentAt ? (
                          <span style={{ color: '#4ade80', fontWeight: 600 }}>✓ Verification email sent</span>
                        ) : reg.verificationEmailLastError ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                            <span style={{ color: '#f87171', fontWeight: 600 }}>⚠ Verification email failed</span>
                            <button
                              type="button"
                              disabled={resendingEmailId === reg._id}
                              onClick={() => handleResendVerificationEmail(reg)}
                              style={{
                                padding: '3px 8px',
                                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                border: '1px solid rgba(239, 68, 68, 0.4)',
                                borderRadius: '4px',
                                color: '#fca5a5',
                                fontSize: '11px',
                                cursor: resendingEmailId === reg._id ? 'not-allowed' : 'pointer',
                                fontWeight: 600,
                              }}
                            >
                              {resendingEmailId === reg._id ? '...' : 'Resend Email'}
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                            <span style={{ color: '#94a3b8' }}>Verification email not sent</span>
                            <button
                              type="button"
                              disabled={resendingEmailId === reg._id}
                              onClick={() => handleResendVerificationEmail(reg)}
                              style={{
                                padding: '3px 8px',
                                backgroundColor: 'rgba(148, 163, 184, 0.15)',
                                border: '1px solid rgba(148, 163, 184, 0.3)',
                                borderRadius: '4px',
                                color: '#cbd5e1',
                                fontSize: '11px',
                                cursor: resendingEmailId === reg._id ? 'not-allowed' : 'pointer',
                                fontWeight: 600,
                              }}
                            >
                              {resendingEmailId === reg._id ? '...' : 'Send Email'}
                            </button>
                          </div>
                        )
                      ) : reg.confirmationEmailSentAt ? (
                        <span style={{ color: '#60a5fa' }}>✓ Confirmation email sent</span>
                      ) : reg.confirmationEmailLastError ? (
                        <span style={{ color: '#fb923c' }}>⚠ Confirmation email failed</span>
                      ) : (
                        <span style={{ color: '#64748b' }}>Not sent</span>
                      )}
                    </div>

                    {/* Touch Action Buttons */}
                    <div className="admin-card-actions">
                      {isVerified ? (
                        <button
                          type="button"
                          className="admin-btn-card-unverify"
                          disabled={isActionBusy}
                          onClick={() => setUnverifyTarget(reg)}
                        >
                          UNVERIFY
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="admin-btn-card-verify"
                          disabled={isActionBusy}
                          onClick={() => setVerifyTarget(reg)}
                        >
                          {isActionBusy ? 'VERIFYING...' : '✓ VERIFY'}
                        </button>
                      )}

                      <button
                        type="button"
                        className="admin-btn-card-details"
                        onClick={() => setSelectedRegistration(reg)}
                      >
                        Details ↗
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── 4. CONFIRMATION MODAL FOR UNVERIFY ── */}
      {unverifyTarget && (
        <div
          className="admin-modal-overlay"
          onClick={() => setUnverifyTarget(null)}
        >
          <div
            className="admin-modal-dialog"
            style={{ maxWidth: '440px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#f8fafc', margin: '0 0 10px' }}>
              Confirm Unverify
            </h3>
            <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.5', margin: '0 0 20px' }}>
              Are you sure you want to mark registration{' '}
              <strong style={{ color: '#60a5fa' }}>{unverifyTarget.registrationId}</strong> (
              {unverifyTarget.teamName || unverifyTarget.leadName}) as <strong>UNVERIFIED</strong>?
              This will remove them from the verified participants list and CSV export.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setUnverifyTarget(null)}
                style={{
                  padding: '9px 16px',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#cbd5e1',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  minHeight: '40px',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmUnverify}
                style={{
                  padding: '9px 18px',
                  backgroundColor: '#dc2626',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  minHeight: '40px',
                }}
              >
                Yes, Unverify
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 4B. CONFIRMATION DIALOG FOR VERIFY ── */}
      {verifyTarget && (
        <div
          className="admin-modal-overlay"
          onClick={() => setVerifyTarget(null)}
        >
          <div
            className="admin-modal-dialog"
            style={{ maxWidth: '460px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#4ade80', margin: '0 0 10px' }}>
              Confirm Participant Verification
            </h3>
            <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.5', margin: '0 0 14px' }}>
              Are you sure you want to verify registration{' '}
              <strong style={{ color: '#60a5fa' }}>{verifyTarget.registrationId}</strong> (
              {verifyTarget.teamName || verifyTarget.leadName})?
            </p>

            <div
              style={{
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '6px',
                padding: '12px 14px',
                marginBottom: '20px',
                color: '#86efac',
                fontSize: '12.5px',
                lineHeight: 1.5,
              }}
            >
              ✉ <strong>Notice:</strong> An approval verification email will be automatically sent to{' '}
              <strong>{verifyTarget.leadEmail}</strong> upon confirmation.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setVerifyTarget(null)}
                style={{
                  padding: '9px 16px',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#cbd5e1',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  minHeight: '40px',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoadingId === verifyTarget._id}
                onClick={async () => {
                  const target = verifyTarget;
                  setVerifyTarget(null);
                  await handleVerify(target);
                }}
                style={{
                  padding: '9px 18px',
                  backgroundColor: '#16a34a',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: actionLoadingId === verifyTarget._id ? 'not-allowed' : 'pointer',
                  minHeight: '40px',
                }}
              >
                {actionLoadingId === verifyTarget._id ? 'Verifying...' : 'Yes, Verify & Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. REGISTRATION DETAILS MODAL ── */}
      {selectedRegistration && (
        <div
          className="admin-modal-overlay"
          onClick={() => setSelectedRegistration(null)}
        >
          <div
            className="admin-modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '14px', marginBottom: '16px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>
                  {selectedRegistration.eventName}
                </h2>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  ID: <strong style={{ color: '#60a5fa' }}>{selectedRegistration.registrationId}</strong> • {new Date(selectedRegistration.createdAt).toLocaleString()}
                </span>
              </div>
              <button
                type="button"
                className="admin-modal-close-btn"
                onClick={() => setSelectedRegistration(null)}
              >
                ✕
              </button>
            </div>

            {/* Verification Status Banner inside Modal */}
            <div
              style={{
                backgroundColor: (selectedRegistration.verified || selectedRegistration.status === 'APPROVED')
                  ? 'rgba(34, 197, 94, 0.1)'
                  : 'rgba(245, 158, 11, 0.1)',
                border: (selectedRegistration.verified || selectedRegistration.status === 'APPROVED')
                  ? '1px solid rgba(34, 197, 94, 0.3)'
                  : '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <span style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Status
                </span>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: (selectedRegistration.verified || selectedRegistration.status === 'APPROVED') ? '#22c55e' : '#f59e0b',
                    marginTop: '2px',
                  }}
                >
                  {(selectedRegistration.verified || selectedRegistration.status === 'APPROVED') ? 'VERIFIED' : 'UNVERIFIED'}
                </div>
              </div>

              {(selectedRegistration.verified || selectedRegistration.status === 'APPROVED') ? (
                <button
                  type="button"
                  onClick={() => {
                    const r = selectedRegistration;
                    setSelectedRegistration(null);
                    setUnverifyTarget(r);
                  }}
                  style={{
                    padding: '8px 14px',
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    borderRadius: '6px',
                    color: '#f87171',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    minHeight: '38px',
                  }}
                >
                  UNVERIFY
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setVerifyTarget(selectedRegistration);
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#166534',
                    border: '1px solid #22c55e',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    minHeight: '38px',
                  }}
                >
                  VERIFY NOW
                </button>
              )}
            </div>

            {/* Team / Lead Details with Tap-to-Call/Mail/WhatsApp */}
            <div style={{ backgroundColor: '#0a0d12', padding: '14px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #1e293b' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
                {selectedRegistration.teamName && selectedRegistration.leadName && selectedRegistration.teamName.toLowerCase() !== selectedRegistration.leadName.toLowerCase()
                  ? `Team: ${selectedRegistration.teamName}`
                  : `Participant: ${selectedRegistration.leadName || selectedRegistration.teamName}`}
              </div>
              <div style={{ fontSize: '13px', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div>Lead Name: <strong style={{ color: '#cbd5e1' }}>{selectedRegistration.leadName}</strong></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span>Email:</span>
                  <a href={`mailto:${selectedRegistration.leadEmail}`} style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: 600 }}>
                    ✉️ {selectedRegistration.leadEmail}
                  </a>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span>Phone:</span>
                  <a href={`tel:${selectedRegistration.leadPhone}`} style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: 600 }}>
                    📞 {selectedRegistration.leadPhone}
                  </a>
                  {selectedRegistration.leadPhone && (
                    <a
                      href={`https://wa.me/91${selectedRegistration.leadPhone.replace(/\D/g, '').slice(-10)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#22c55e', textDecoration: 'none', fontWeight: 600, fontSize: '12px' }}
                    >
                      💬 WhatsApp
                    </a>
                  )}
                </div>
                <div>
                  College: <strong style={{ color: '#cbd5e1' }}>{selectedRegistration.leadCollege || 'PCCOE'}</strong>{' '}
                  {selectedRegistration.isPccoe && <span style={{ color: '#22c55e', fontWeight: 700 }}>[PCCOE Free Registration]</span>}
                </div>
              </div>
            </div>

            {/* Members breakdown */}
            {selectedRegistration.members && selectedRegistration.members.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', margin: '0 0 8px' }}>
                  Team Members ({selectedRegistration.members.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedRegistration.members.map((m, idx) => (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: '#0a0d12',
                        border: '1px solid #1e293b',
                        borderRadius: '6px',
                        padding: '10px 14px',
                        fontSize: '12.5px',
                      }}
                    >
                      <div style={{ fontWeight: 700, color: '#f8fafc' }}>
                        #{idx + 1} {m.name || 'Member'}
                      </div>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '4px', flexWrap: 'wrap' }}>
                        {m.phone && (
                          <a href={`tel:${m.phone}`} style={{ color: '#60a5fa', textDecoration: 'none' }}>
                            📞 {m.phone}
                          </a>
                        )}
                        {m.email && (
                          <a href={`mailto:${m.email}`} style={{ color: '#94a3b8', textDecoration: 'none' }}>
                            ✉️ {m.email}
                          </a>
                        )}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '11.5px', marginTop: '3px' }}>
                        {m.college || 'PCCOE'} {m.year ? `(${m.year})` : ''} {m.branch ? `[${m.branch}]` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment & Transaction details */}
            <div style={{ backgroundColor: '#0a0d12', padding: '14px', borderRadius: '8px', border: '1px solid #1e293b', marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>Fee Amount:</span>
                <span style={{ fontSize: '16px', fontWeight: 700, color: selectedRegistration.amount === 0 ? '#22c55e' : '#facc15' }}>
                  {selectedRegistration.amount === 0 ? '₹0 (Free)' : `₹${selectedRegistration.amount}`}
                </span>
              </div>
              {selectedRegistration.transactionId && (
                <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
                  Transaction ID: <strong style={{ color: '#cbd5e1' }}>{selectedRegistration.transactionId}</strong>
                </div>
              )}
              {selectedRegistration.screenshotUrl && (
                <div style={{ marginTop: '10px' }}>
                  <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                    Payment Screenshot:
                  </span>
                  <a href={selectedRegistration.screenshotUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block' }}>
                    <img
                      src={selectedRegistration.screenshotUrl}
                      alt="Payment proof"
                      style={{ width: '100%', maxWidth: '100%', maxHeight: '240px', objectFit: 'contain', borderRadius: '6px', border: '1px solid #334155' }}
                    />
                    <div style={{ fontSize: '11.5px', color: '#38bdf8', marginTop: '4px' }}>↗ Tap to view full size</div>
                  </a>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedRegistration(null)}
              style={{
                width: '100%',
                padding: '12px',
                minHeight: '44px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#f8fafc',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
