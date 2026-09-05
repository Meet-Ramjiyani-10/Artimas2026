'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';

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
  'pixel-perfect': 'Pixel Perfect',
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
  const [selectedRegistration, setSelectedRegistration] = useState<RegistrationItem | null>(null);

  // Confirmation dialog for Unverify
  const [unverifyTarget, setUnverifyTarget] = useState<RegistrationItem | null>(null);

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
            r._id === reg._id ? { ...r, verified: true, status: 'APPROVED' } : r
          )
        );
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
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#0a0d12',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          fontFamily: "'Segoe UI', Roboto, sans-serif",
          color: '#e2e8f0',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '420px',
            backgroundColor: '#111722',
            border: '1px solid #1e293b',
            borderRadius: '8px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            padding: '32px 28px',
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
                  padding: '11px 13px',
                  backgroundColor: '#0a0d12',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '14px',
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
                placeholder={`Enter password`}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '11px 13px',
                  backgroundColor: '#0a0d12',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '14px',
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
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#0a0d12',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          fontFamily: "'Segoe UI', Roboto, sans-serif",
          color: '#e2e8f0',
        }}
      >
        <div
          style={{
            maxWidth: '480px',
            backgroundColor: '#111722',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '8px',
            padding: '28px',
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

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
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
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0a0d12',
        color: '#e2e8f0',
        fontFamily: "'Segoe UI', Roboto, sans-serif",
        padding: '24px 20px',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Top Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #1e293b',
            paddingBottom: '16px',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isMaster && (
              <button
                type="button"
                onClick={() => router.push('/admin')}
                style={{
                  padding: '8px 14px',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#cbd5e1',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
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
                padding: '8px 14px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#cbd5e1',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {isLoading ? 'REFRESHING...' : '↻ REFRESH'}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              style={{
                padding: '8px 14px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '6px',
                color: '#f87171',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
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

        {/* ── Key Metrics Cards Banner ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '14px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              backgroundColor: '#111722',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              padding: '16px 20px',
            }}
          >
            <span style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Registrations
            </span>
            <div style={{ fontSize: '26px', fontWeight: 700, color: '#f8fafc', marginTop: '4px' }}>
              {totalCount}
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#111722',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              padding: '16px 20px',
            }}
          >
            <span style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Verified
            </span>
            <div style={{ fontSize: '26px', fontWeight: 700, color: '#22c55e', marginTop: '4px' }}>
              {verifiedCount}
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#111722',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              padding: '16px 20px',
            }}
          >
            <span style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Unverified
            </span>
            <div style={{ fontSize: '26px', fontWeight: 700, color: '#f59e0b', marginTop: '4px' }}>
              {unverifiedCount}
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#111722',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              padding: '16px 20px',
            }}
          >
            <span style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Teams
            </span>
            <div style={{ fontSize: '26px', fontWeight: 700, color: '#60a5fa', marginTop: '4px' }}>
              {totalTeamsCount}
            </div>
          </div>
        </div>

        {/* ── Search & Filter Controls ── */}
        <div
          style={{
            backgroundColor: '#111722',
            border: '1px solid #1e293b',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '16px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', flex: 1 }}>
            {/* Search Input */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, team, lead, email, phone, college..."
              style={{
                backgroundColor: '#0a0d12',
                border: '1px solid #334155',
                borderRadius: '6px',
                padding: '8px 12px',
                color: '#ffffff',
                fontSize: '13px',
                minWidth: '260px',
                flex: '1 1 260px',
                outline: 'none',
              }}
            />

            {/* Verification Status Filter */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {(['ALL', 'VERIFIED', 'UNVERIFIED'] as const).map((statusKey) => (
                <button
                  key={statusKey}
                  type="button"
                  onClick={() => setVerificationFilter(statusKey)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: verificationFilter === statusKey ? '#2563eb' : '#0a0d12',
                    border: verificationFilter === statusKey ? '1px solid #3b82f6' : '1px solid #334155',
                    color: verificationFilter === statusKey ? '#ffffff' : '#cbd5e1',
                    transition: 'all 0.15s',
                  }}
                >
                  {statusKey === 'ALL' && `All (${registrations.length})`}
                  {statusKey === 'VERIFIED' && `Verified (${verifiedCount})`}
                  {statusKey === 'UNVERIFIED' && `Unverified (${unverifiedCount})`}
                </button>
              ))}
            </div>
          </div>

          {/* Export Verified CSV Button */}
          <button
            type="button"
            onClick={handleExportVerifiedCsv}
            style={{
              padding: '8px 16px',
              backgroundColor: '#166534',
              border: '1px solid #22c55e',
              borderRadius: '6px',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            📥 EXPORT VERIFIED CSV ({verifiedCount})
          </button>
        </div>

        {/* ── Registrations Data Table ── */}
        {isLoading && registrations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
            Loading {eventDisplayName} registrations...
          </div>
        ) : filteredRegistrations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8', backgroundColor: '#111722', borderRadius: '8px', border: '1px solid #1e293b' }}>
            No registrations found matching your filters.
          </div>
        ) : (
          <div
            style={{
              backgroundColor: '#111722',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              overflowX: 'auto',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#0a0d12', borderBottom: '1px solid #1e293b', color: '#94a3b8' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>REG ID</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>TEAM NAME</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>TEAM LEAD</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>CONTACT</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>COLLEGE</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>MEMBERS</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>VERIFICATION STATUS</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'center' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegistrations.map((reg) => {
                  const isVerified = reg.verified === true || reg.status === 'APPROVED';
                  const isActionBusy = actionLoadingId === reg._id;

                  return (
                    <tr
                      key={reg._id}
                      style={{
                        borderBottom: '1px solid #1e293b',
                        transition: 'background-color 0.15s',
                      }}
                    >
                      {/* REG ID */}
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap' }}>
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
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#f8fafc' }}>
                        {reg.teamName || reg.leadName || '—'}
                      </td>

                      {/* TEAM LEAD */}
                      <td style={{ padding: '12px 16px', color: '#e2e8f0' }}>
                        <div style={{ fontWeight: 600 }}>{reg.leadName}</div>
                      </td>

                      {/* CONTACT */}
                      <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '12px' }}>
                        <div>{reg.leadPhone}</div>
                        <div style={{ color: '#64748b', fontSize: '11px' }}>{reg.leadEmail}</div>
                      </td>

                      {/* COLLEGE */}
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
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
                      <td style={{ padding: '12px 16px', color: '#94a3b8', textAlign: 'center' }}>
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

                      {/* VERIFICATION STATUS */}
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        {isVerified ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              color: '#22c55e',
                              backgroundColor: 'rgba(34, 197, 94, 0.12)',
                              border: '1px solid rgba(34, 197, 94, 0.3)',
                              padding: '3px 9px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 700,
                              letterSpacing: '0.5px',
                            }}
                          >
                            ✓ VERIFIED
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              color: '#f59e0b',
                              backgroundColor: 'rgba(245, 158, 11, 0.12)',
                              border: '1px solid rgba(245, 158, 11, 0.3)',
                              padding: '3px 9px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 700,
                              letterSpacing: '0.5px',
                            }}
                          >
                            ● UNVERIFIED
                          </span>
                        )}
                      </td>

                      {/* ACTION */}
                      <td style={{ padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
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
                              onClick={() => handleVerify(reg)}
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
        )}
      </div>

      {/* ── 4. CONFIRMATION MODAL FOR UNVERIFY ── */}
      {unverifyTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '20px',
          }}
          onClick={() => setUnverifyTarget(null)}
        >
          <div
            style={{
              backgroundColor: '#111722',
              border: '1px solid #334155',
              borderRadius: '8px',
              maxWidth: '440px',
              width: '100%',
              padding: '24px',
              color: '#e2e8f0',
            }}
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
                  padding: '8px 14px',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#cbd5e1',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmUnverify}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#dc2626',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Yes, Unverify
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. REGISTRATION DETAILS MODAL ── */}
      {selectedRegistration && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setSelectedRegistration(null)}
        >
          <div
            style={{
              backgroundColor: '#111722',
              border: '1px solid #334155',
              borderRadius: '10px',
              maxWidth: '620px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
              color: '#e2e8f0',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '14px', marginBottom: '18px' }}>
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
                onClick={() => setSelectedRegistration(null)}
                style={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  color: '#94a3b8',
                  borderRadius: '6px',
                  width: '32px',
                  height: '32px',
                  fontSize: '16px',
                  cursor: 'pointer',
                }}
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
                borderRadius: '6px',
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
                    padding: '6px 12px',
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    borderRadius: '4px',
                    color: '#f87171',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  UNVERIFY
                </button>
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    await handleVerify(selectedRegistration);
                    setSelectedRegistration((prev) => prev ? { ...prev, verified: true, status: 'APPROVED' } : null);
                  }}
                  style={{
                    padding: '6px 14px',
                    backgroundColor: '#166534',
                    border: '1px solid #22c55e',
                    borderRadius: '4px',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  VERIFY NOW
                </button>
              )}
            </div>

            {/* Team / Lead Details */}
            <div style={{ backgroundColor: '#0a0d12', padding: '14px', borderRadius: '6px', marginBottom: '16px', border: '1px solid #1e293b' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', marginBottom: '6px' }}>
                {selectedRegistration.teamName && selectedRegistration.leadName && selectedRegistration.teamName.toLowerCase() !== selectedRegistration.leadName.toLowerCase()
                  ? `Team: ${selectedRegistration.teamName}`
                  : `Participant: ${selectedRegistration.leadName || selectedRegistration.teamName}`}
              </div>
              <div style={{ fontSize: '13px', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>Lead Name: <strong style={{ color: '#cbd5e1' }}>{selectedRegistration.leadName}</strong></div>
                <div>Email: <strong style={{ color: '#cbd5e1' }}>{selectedRegistration.leadEmail}</strong></div>
                <div>Phone: <strong style={{ color: '#cbd5e1' }}>{selectedRegistration.leadPhone}</strong></div>
                <div>College: <strong style={{ color: '#cbd5e1' }}>{selectedRegistration.leadCollege || 'PCCOE'}</strong> {selectedRegistration.isPccoe && <span style={{ color: '#22c55e', fontWeight: 700 }}>[PCCOE Free Registration]</span>}</div>
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
                      <div style={{ color: '#94a3b8', marginTop: '2px' }}>
                        {m.email} • {m.phone}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '11.5px', marginTop: '2px' }}>
                        {m.college || 'PCCOE'} {m.year ? `(${m.year})` : ''} {m.branch ? `[${m.branch}]` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment & Transaction details */}
            <div style={{ backgroundColor: '#0a0d12', padding: '14px', borderRadius: '6px', border: '1px solid #1e293b', marginBottom: '18px' }}>
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
                  <a href={selectedRegistration.screenshotUrl} target="_blank" rel="noopener noreferrer">
                    <img
                      src={selectedRegistration.screenshotUrl}
                      alt="Payment proof"
                      style={{ maxWidth: '100%', maxHeight: '180px', borderRadius: '4px', border: '1px solid #334155' }}
                    />
                  </a>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedRegistration(null)}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#f8fafc',
                fontWeight: 600,
                fontSize: '13px',
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
