'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import './admin.css';

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
  verifiedBy?: string;
  emailStatus?: 'sent' | 'failed' | null;
  emailSentAt?: string | null;
  emailLastError?: string | null;
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

interface AdminEvent {
  id: string;
  name: string;
  slug: string;
  category: string;
  yuga: string;
  registrationFee: number;
  registrationOpen: boolean;
  active: boolean;
  registrationCount: number;
}

interface AdminStats {
  total: number;
  totalRegistrations?: number;
  totalVerified?: number;
  totalUnverified?: number;
  totalEvents?: number;
  confirmed: number;
  pending: number;
  approved: number;
  verified?: number;
  unverified?: number;
  rejected: number;
  pccoeFree: number;
  totalRevenue: number;
  byEvent: Array<{
    eventName: string;
    eventSlug: string;
    count: number;
    confirmed: number;
    pending: number;
    approved: number;
    verified?: number;
    unverified?: number;
    rejected: number;
    pccoeCount: number;
    revenue: number;
  }>;
}

export default function AdminPortal() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<AdminProfile | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

  // Login form state
  const [username, setUsername] = useState<string>('admin');
  const [password, setPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Active tab: 'registrations' | 'events' | 'stats'
  const [activeTab, setActiveTab] = useState<'registrations' | 'events' | 'stats'>('registrations');

  // Dashboard state
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [togglingEventId, setTogglingEventId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Filter & Search states
  const [selectedEventFilter, setSelectedEventFilter] = useState<string>('ALL');
  const [selectedPccoeFilter, setSelectedPccoeFilter] = useState<string>('ALL');
  const [selectedVerificationFilter, setSelectedVerificationFilter] = useState<'ALL' | 'VERIFIED' | 'UNVERIFIED'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'auto' | 'cards' | 'table'>('auto');
  const [selectedRegistration, setSelectedRegistration] = useState<RegistrationItem | null>(null);
  const [unverifyTarget, setUnverifyTarget] = useState<RegistrationItem | null>(null);
  const [verifyTarget, setVerifyTarget] = useState<RegistrationItem | null>(null);
  const [resendingEmailId, setResendingEmailId] = useState<string | null>(null);

  // Check saved token on mount and redirect event admin if needed
  useEffect(() => {
    const savedToken = typeof window !== 'undefined' ? sessionStorage.getItem('artimas_admin_token') : null;
    const savedUserStr = typeof window !== 'undefined' ? sessionStorage.getItem('artimas_admin_user') : null;

    if (savedToken) {
      setToken(savedToken);
      if (savedUserStr) {
        try {
          const parsed = JSON.parse(savedUserStr);
          setAdminUser(parsed);
          if (parsed.role === 'EVENT_ADMIN' && parsed.eventSlug) {
            router.push(`/admin/${parsed.eventSlug}`);
            return;
          }
        } catch {}
      }
    }
    setIsCheckingAuth(false);
  }, [router]);

  // Fetch all dashboard data (Events, Registrations, Stats)
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

      const [eventsRes, regsRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/admin/events?_t=${cacheBust}`, { headers, cache: 'no-store' }),
        fetch(`${API_BASE}/admin/registrations?limit=1000&_t=${cacheBust}`, { headers, cache: 'no-store' }),
        fetch(`${API_BASE}/admin/stats?_t=${cacheBust}`, { headers, cache: 'no-store' }),
      ]);

      if (eventsRes.status === 401 || eventsRes.status === 403) {
        sessionStorage.removeItem('artimas_admin_token');
        setToken(null);
        setLoginError('Session expired. Please log in again.');
        return;
      }

      const [eventsJson, regsJson, statsJson] = await Promise.all([
        eventsRes.json(),
        regsRes.json(),
        statsRes.json(),
      ]);

      if (eventsJson.success && Array.isArray(eventsJson.data)) {
        setEvents(eventsJson.data);
      }
      if (regsJson.success && Array.isArray(regsJson.data)) {
        setRegistrations(regsJson.data);
      }
      if (statsJson.success && statsJson.data) {
        setStats(statsJson.data);
      }
    } catch {
      setErrorMessage('Unable to connect to backend service. Ensure server is running.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchData(token);
    }
  }, [token, fetchData]);

  // Handle Login submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!password.trim()) {
      setLoginError('Please enter the admin password');
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim() || undefined,
          password: password.trim(),
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
        setPassword('');

        // If an event admin logged in, redirect to their specific event dashboard
        if (user.role === 'EVENT_ADMIN' && user.eventSlug) {
          router.push(`/admin/${user.eventSlug}`);
        }
      } else {
        setLoginError('Authentication failed: No token received');
      }
    } catch {
      setLoginError('Unable to connect to backend service');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    sessionStorage.removeItem('artimas_admin_token');
    sessionStorage.removeItem('artimas_admin_user');
    setToken(null);
    setAdminUser(null);
    setEvents([]);
    setRegistrations([]);
    setStats(null);
    setPassword('');
    setLoginError('');
  };

  // Verify participant
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
        body: JSON.stringify({ remarks: 'Verified by Master Admin' }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setRegistrations((prev) =>
          prev.map((r) =>
            r._id === reg._id
              ? {
                  ...r,
                  verified: true,
                  status: 'APPROVED',
                  emailStatus: json.data?.emailStatus || r.emailStatus,
                  emailSentAt: json.data?.emailSentAt || r.emailSentAt,
                  emailLastError: json.data?.emailLastError || r.emailLastError,
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
                  emailStatus: json.data?.emailStatus || prev.emailStatus,
                  emailSentAt: json.data?.emailSentAt || prev.emailSentAt,
                  emailLastError: json.data?.emailLastError || prev.emailLastError,
                  verificationEmailSentAt: json.data?.verificationEmailSentAt || prev.verificationEmailSentAt,
                  verificationEmailLastError: json.data?.verificationEmailLastError,
                }
              : null
          );
        }
        setStats((prev) => prev ? {
          ...prev,
          approved: prev.approved + 1,
          verified: (prev.verified ?? prev.approved) + 1,
          unverified: Math.max((prev.unverified ?? 0) - 1, 0),
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

  // Send / Resend verification email
  const handleSendVerificationEmail = async (reg: RegistrationItem) => {
    if (!token) return;
    setResendingEmailId(reg._id);

    try {
      const res = await fetch(`${API_BASE}/admin/registrations/${reg.registrationId}/send-verification-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();
      if (res.ok && json.success) {
        const now = json.data?.emailSentAt || json.data?.verificationEmailSentAt || new Date().toISOString();
        setRegistrations((prev) =>
          prev.map((r) =>
            r._id === reg._id
              ? {
                  ...r,
                  emailStatus: 'sent',
                  emailSentAt: now,
                  emailLastError: null,
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
                  emailStatus: 'sent',
                  emailSentAt: now,
                  emailLastError: null,
                  verificationEmailSentAt: now,
                  verificationEmailLastError: null,
                }
              : null
          );
        }
        alert(`✓ Email Sent Successfully to ${reg.leadEmail}`);
      } else {
        const errMsg = json.message || 'Failed to send email';
        alert(`Email Not Sent: ${errMsg}`);
        const lastErr = json.data?.emailLastError || json.data?.verificationEmailLastError || errMsg;
        setRegistrations((prev) =>
          prev.map((r) =>
            r._id === reg._id
              ? {
                  ...r,
                  emailStatus: 'failed',
                  emailLastError: lastErr,
                  verificationEmailLastError: lastErr,
                }
              : r
          )
        );
        if (selectedRegistration && selectedRegistration._id === reg._id) {
          setSelectedRegistration((prev) =>
            prev
              ? {
                  ...prev,
                  emailStatus: 'failed',
                  emailLastError: lastErr,
                  verificationEmailLastError: lastErr,
                }
              : null
          );
        }
      }
    } catch {
      alert('Network error while sending verification email');
    } finally {
      setResendingEmailId(null);
    }
  };

  // Unverify participant
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
        body: JSON.stringify({ remarks: 'Verification undone by Master Admin' }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setRegistrations((prev) =>
          prev.map((r) =>
            r._id === reg._id ? { ...r, verified: false, status: 'CONFIRMED' } : r
          )
        );
        setStats((prev) => prev ? {
          ...prev,
          approved: Math.max(prev.approved - 1, 0),
          verified: Math.max((prev.verified ?? prev.approved) - 1, 0),
          unverified: (prev.unverified ?? 0) + 1,
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

  // Toggle registration open/closed
  const handleToggleRegistration = async (event: AdminEvent) => {
    if (!token) return;
    setTogglingEventId(event.id);

    try {
      const newStatus = !event.registrationOpen;
      const res = await fetch(`${API_BASE}/admin/events/${event.id}/registration`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ registrationOpen: newStatus }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setEvents((prev) =>
          prev.map((e) =>
            e.id === event.id ? { ...e, registrationOpen: newStatus, active: newStatus } : e
          )
        );
      } else {
        alert(json.message || 'Failed to update registration status');
      }
    } catch {
      alert('Network error while updating registration status');
    } finally {
      setTogglingEventId(null);
    }
  };

  // Filtered registrations based on Event, PCCOE flag, Verification, and Search query
  const filteredRegistrations = useMemo(() => {
    return registrations.filter((reg) => {
      const isVerified = reg.verified === true || reg.status === 'APPROVED';

      // Verification status filter
      if (selectedVerificationFilter === 'VERIFIED' && !isVerified) return false;
      if (selectedVerificationFilter === 'UNVERIFIED' && isVerified) return false;

      // Event filter
      if (selectedEventFilter !== 'ALL') {
        const sel = selectedEventFilter.toLowerCase();
        const regName = (reg.eventName || '').toLowerCase();
        const regSlug = (reg.eventSlug || '').toLowerCase();
        const matchesEvent =
          regName === sel ||
          regSlug === sel ||
          (sel.includes('capture') && regName.includes('capture'));
        if (!matchesEvent) return false;
      }

      // PCCOE filter
      if (selectedPccoeFilter === 'PCCOE' && !reg.isPccoe) return false;
      if (selectedPccoeFilter === 'EXTERNAL' && reg.isPccoe) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const searchPool = [
          reg.registrationId,
          reg.eventName,
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

        if (!searchPool.includes(q)) return false;
      }

      return true;
    });
  }, [registrations, selectedVerificationFilter, selectedEventFilter, selectedPccoeFilter, searchQuery]);

  // Server-side Verified CSV Export
  const handleExportVerifiedCSV = () => {
    if (!token) return;
    const verifiedCount = filteredRegistrations.filter((r) => r.verified || r.status === 'APPROVED').length;
    if (verifiedCount === 0) {
      alert('No verified registrations found matching the current filter.');
      return;
    }

    const eventParam = selectedEventFilter !== 'ALL' ? `?eventSlug=${encodeURIComponent(selectedEventFilter)}` : '';
    const url = `${API_BASE}/admin/export/verified-csv${eventParam}`;

    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Failed to export verified CSV');
        }
        return res.blob();
      })
      .then((blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `ARTIMAS26_Verified_${selectedEventFilter !== 'ALL' ? selectedEventFilter : 'ALL'}_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
      })
      .catch((err) => {
        alert(`Export failed: ${err.message}`);
      });
  };

  // Full CSV Export (Existing functionality)
  const handleExportCSV = () => {
    if (filteredRegistrations.length === 0) {
      alert('No registrations to export.');
      return;
    }

    const headers = [
      'Registration ID',
      'Event Name',
      'Team / Entry Name',
      'Lead Name',
      'Lead Email',
      'Lead Phone',
      'Lead College',
      'PCCOE Student',
      'Verification Status',
      'Total Members',
      'All Members (Name, Email, Phone, College, Year, Branch)',
      'Fee Amount (INR)',
      'Transaction ID',
      'Status',
      'Registration Date',
    ];

    const rows = filteredRegistrations.map((r) => {
      const allMembersStr = (r.members && r.members.length > 0)
        ? r.members
            .map(
              (m, i) =>
                `#${i + 1}: ${m.name || ''} <${m.email || ''}> Phone: ${m.phone || ''} [${m.college || ''} - ${m.year || ''} ${m.branch || ''}]`
            )
            .join(' | ')
        : `${r.leadName} <${r.leadEmail}>`;

      return [
        `"${r.registrationId || ''}"`,
        `"${r.eventName || ''}"`,
        `"${(r.teamName || r.leadName || '').replace(/"/g, '""')}"`,
        `"${(r.leadName || '').replace(/"/g, '""')}"`,
        `"${r.leadEmail || ''}"`,
        `"${r.leadPhone || ''}"`,
        `"${(r.leadCollege || '').replace(/"/g, '""')}"`,
        `"${r.isPccoe ? 'YES (Free)' : 'NO (Paid)'}"`,
        `"${(r.verified || r.status === 'APPROVED') ? 'VERIFIED' : 'UNVERIFIED'}"`,
        `"${r.members?.length || 1}"`,
        `"${allMembersStr.replace(/"/g, '""')}"`,
        `"${r.amount || 0}"`,
        `"${(r.transactionId || '').replace(/"/g, '""')}"`,
        `"${r.status || 'CONFIRMED'}"`,
        `"${new Date(r.createdAt).toLocaleString()}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const fileName = `ARTIMAS26_Registrations_${selectedEventFilter !== 'ALL' ? selectedEventFilter : 'ALL'}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isCheckingAuth) {
    return null;
  }

  // ── 1. LOGIN SCREEN ──
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
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
            padding: '28px 22px',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '2px', color: '#f8fafc', margin: '0 0 6px' }}>
              ARTIMAS 26
            </h1>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Admin Portal
            </p>
          </div>

          <form onSubmit={handleLogin} noValidate>
            <div style={{ marginBottom: '16px' }}>
              <label
                htmlFor="admin-username"
                style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px', letterSpacing: '0.5px' }}
              >
                ADMIN USERNAME / EMAIL
              </label>
              <input
                id="admin-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin or event username"
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
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label
                htmlFor="admin-password"
                style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px', letterSpacing: '0.5px' }}
              >
                ACCESS PASSWORD
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
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

  // ── 2. ADMIN DASHBOARD ──
  return (
    <div className="admin-container">
      <div className="admin-wrapper">
        {/* Top Header */}
        <div className="admin-header">
          <div className="admin-header-title-area">
            <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '1px', color: '#f8fafc', margin: '0 0 4px' }}>
              ARTIMAS 26 ADMIN PORTAL
            </h1>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
              Festival Registration Management & Data Explorer{adminUser?.name ? ` • Logged in as ${adminUser.name}` : ''}
            </p>
          </div>

          <div className="admin-header-actions">
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
          {/* Total Registrations */}
          <div className="admin-metric-card">
            <span className="admin-metric-label">Total Registrations</span>
            <div className="admin-metric-value" style={{ color: '#f8fafc' }}>
              {stats?.totalRegistrations ?? stats?.total ?? registrations.length}
            </div>
          </div>

          {/* Total Verified */}
          <div className="admin-metric-card">
            <span className="admin-metric-label">Total Verified</span>
            <div className="admin-metric-value" style={{ color: '#22c55e' }}>
              {stats?.totalVerified ?? stats?.approved ?? registrations.filter((r) => r.verified || r.status === 'APPROVED').length}
            </div>
          </div>

          {/* Total Unverified */}
          <div className="admin-metric-card">
            <span className="admin-metric-label">Total Unverified</span>
            <div className="admin-metric-value" style={{ color: '#f59e0b' }}>
              {stats?.totalUnverified ?? registrations.filter((r) => !r.verified && r.status !== 'APPROVED').length}
            </div>
          </div>

          {/* Total Revenue */}
          <div className="admin-metric-card">
            <span className="admin-metric-label">Total Revenue</span>
            <div className="admin-metric-value" style={{ color: '#facc15' }}>
              ₹{stats?.totalRevenue ?? registrations.reduce((sum, r) => sum + (r.amount || 0), 0)}
            </div>
          </div>

          {/* Total Events (spans full 2-columns on mobile) */}
          <div className="admin-metric-card span-full-mobile">
            <span className="admin-metric-label">Total Events</span>
            <div className="admin-metric-value" style={{ color: '#60a5fa' }}>
              {stats?.totalEvents ?? events.length}
            </div>
          </div>
        </div>

        {/* ── Navigation Tabs ── */}
        <div className="admin-tabs-bar">
          <div className="admin-tabs-list">
            <button
              type="button"
              onClick={() => setActiveTab('registrations')}
              className={`admin-tab-btn ${activeTab === 'registrations' ? 'active' : ''}`}
            >
              📋 Registrations ({filteredRegistrations.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('events')}
              className={`admin-tab-btn ${activeTab === 'events' ? 'active' : ''}`}
            >
              ⚙️ Event Controls ({events.length})
            </button>
          </div>

          {/* View switcher when in registrations tab */}
          {activeTab === 'registrations' && (
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
          )}
        </div>

        {/* ── TAB 1: REGISTRATIONS EXPLORER ── */}
        {activeTab === 'registrations' && (
          <div>
            {/* Filter & Action Controls Bar */}
            <div className="admin-filters-card">
              <div className="admin-filters-inputs">
                {/* Search Bar */}
                <div className="admin-search-wrapper">
                  <span className="admin-search-icon">🔍</span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by ID, name, email, college, phone..."
                    className="admin-search-input"
                  />
                </div>

                {/* Event Filter */}
                <select
                  value={selectedEventFilter}
                  onChange={(e) => setSelectedEventFilter(e.target.value)}
                  className="admin-select"
                >
                  <option value="ALL">All Events ({registrations.length})</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.name}>
                      {ev.name} ({ev.registrationCount})
                    </option>
                  ))}
                </select>

                {/* Verification Status Filter */}
                <select
                  value={selectedVerificationFilter}
                  onChange={(e) => setSelectedVerificationFilter(e.target.value as 'ALL' | 'VERIFIED' | 'UNVERIFIED')}
                  className="admin-select"
                >
                  <option value="ALL">All Verification</option>
                  <option value="VERIFIED">Verified Only</option>
                  <option value="UNVERIFIED">Unverified Only</option>
                </select>

                {/* PCCOE Filter */}
                <select
                  value={selectedPccoeFilter}
                  onChange={(e) => setSelectedPccoeFilter(e.target.value)}
                  className="admin-select"
                >
                  <option value="ALL">All Colleges</option>
                  <option value="PCCOE">PCCOE Verified (Free)</option>
                  <option value="EXTERNAL">External Colleges (Paid)</option>
                </select>
              </div>

              {/* Action Buttons: Export Verified CSV + Full CSV */}
              <div className="admin-export-group">
                <button
                  type="button"
                  onClick={handleExportVerifiedCSV}
                  className="admin-btn-export-verified"
                >
                  📥 EXPORT VERIFIED CSV ({filteredRegistrations.filter((r) => r.verified || r.status === 'APPROVED').length})
                </button>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="admin-btn-export-all"
                >
                  📥 EXPORT ALL ({filteredRegistrations.length})
                </button>
              </div>
            </div>

            {/* Registrations View */}
            {isLoading && registrations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
                Loading registrations...
              </div>
            ) : filteredRegistrations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8', backgroundColor: '#111722', borderRadius: '8px', border: '1px solid #1e293b' }}>
                No registrations found matching your filters.
              </div>
            ) : (
              <>
                {/* 1. DESKTOP TABLE VIEW (Visible on desktop or when forced via Table toggle) */}
                <div className={viewMode === 'cards' ? 'desktop-only-view' : viewMode === 'auto' ? 'desktop-only-view admin-table-card' : 'admin-table-card'}>
                  <table className="admin-data-table">
                    <thead>
                      <tr>
                        <th>REG ID</th>
                        <th>EVENT</th>
                        <th>LEAD / TEAM</th>
                        <th>CONTACT</th>
                        <th>COLLEGE</th>
                        <th>MEMBERS</th>
                        <th>FEE</th>
                        <th>VERIFICATION STATUS</th>
                        <th>EMAIL STATUS</th>
                        <th style={{ textAlign: 'center' }}>ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRegistrations.map((reg) => {
                        const isVerified = reg.verified === true || reg.status === 'APPROVED';
                        const isActionBusy = actionLoadingId === reg._id;

                        return (
                          <tr key={reg._id}>
                            <td style={{ fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap' }}>
                              <span
                                style={{
                                  backgroundColor: '#1e293b',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                }}
                              >
                                {reg.registrationId}
                              </span>
                            </td>
                            <td style={{ fontWeight: 600, color: '#cbd5e1' }}>
                              {reg.eventName}
                            </td>
                            <td style={{ color: '#e2e8f0' }}>
                              <div style={{ fontWeight: 600 }}>{reg.teamName || reg.leadName}</div>
                              {reg.teamName && reg.leadName && reg.teamName.toLowerCase() !== reg.leadName.toLowerCase() && (
                                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Lead: {reg.leadName}</div>
                              )}
                            </td>
                            <td style={{ color: '#94a3b8', fontSize: '12px' }}>
                              <div>
                                <a href={`tel:${reg.leadPhone}`} style={{ color: '#cbd5e1', textDecoration: 'none' }}>
                                  {reg.leadPhone}
                                </a>
                              </div>
                              <div style={{ fontSize: '11px', color: '#64748b' }}>
                                <a href={`mailto:${reg.leadEmail}`} style={{ color: '#64748b', textDecoration: 'none' }}>
                                  {reg.leadEmail}
                                </a>
                              </div>
                            </td>
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
                            <td style={{ color: '#94a3b8', textAlign: 'center' }}>
                              {reg.members?.length || 1}
                            </td>
                            <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                              {reg.amount === 0 ? (
                                <span style={{ color: '#22c55e' }}>₹0</span>
                              ) : (
                                <span style={{ color: '#facc15' }}>₹{reg.amount}</span>
                              )}
                            </td>
                            {/* VERIFICATION STATUS */}
                            <td style={{ whiteSpace: 'nowrap' }}>
                              {isVerified ? (
                                <span className="admin-status-verified-badge">
                                  ✓ VERIFIED
                                </span>
                              ) : (
                                <span className="admin-status-unverified-badge">
                                  ● UNVERIFIED
                                </span>
                              )}
                            </td>

                            {/* EMAIL STATUS */}
                            <td style={{ whiteSpace: 'nowrap' }}>
                              <div style={{ fontSize: '12px' }}>
                                {isVerified ? (
                                  reg.emailStatus === 'sent' || reg.emailSentAt ? (
                                    <span style={{ color: '#4ade80', fontWeight: 600 }}>
                                      ✓ Email Sent Successfully
                                    </span>
                                  ) : reg.emailStatus === 'failed' ? (
                                    <span style={{ color: '#f87171', fontWeight: 600 }}>
                                      ⚠ Email Not Sent
                                    </span>
                                  ) : (
                                    <span style={{ color: '#94a3b8' }}>
                                      Email Not Sent
                                    </span>
                                  )
                                ) : (
                                  <span style={{ color: '#64748b' }}>
                                    Pending Verification
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* ACTION */}
                            <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                {isVerified ? (
                                  <>
                                    {/* SEND / RESEND / RETRY EMAIL BUTTON */}
                                    {reg.emailStatus === 'sent' || reg.emailSentAt ? (
                                      <button
                                        type="button"
                                        disabled={resendingEmailId === reg._id}
                                        onClick={() => handleSendVerificationEmail(reg)}
                                        style={{
                                          padding: '5px 10px',
                                          backgroundColor: 'rgba(14, 165, 233, 0.15)',
                                          border: '1px solid rgba(14, 165, 233, 0.4)',
                                          borderRadius: '4px',
                                          color: '#38bdf8',
                                          fontSize: '11.5px',
                                          fontWeight: 600,
                                          cursor: resendingEmailId === reg._id ? 'not-allowed' : 'pointer',
                                          opacity: resendingEmailId === reg._id ? 0.6 : 1,
                                        }}
                                      >
                                        {resendingEmailId === reg._id ? 'Sending...' : 'RESEND EMAIL'}
                                      </button>
                                    ) : reg.emailStatus === 'failed' ? (
                                      <button
                                        type="button"
                                        disabled={resendingEmailId === reg._id}
                                        onClick={() => handleSendVerificationEmail(reg)}
                                        style={{
                                          padding: '5px 10px',
                                          backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                          border: '1px solid rgba(239, 68, 68, 0.4)',
                                          borderRadius: '4px',
                                          color: '#fca5a5',
                                          fontSize: '11.5px',
                                          fontWeight: 600,
                                          cursor: resendingEmailId === reg._id ? 'not-allowed' : 'pointer',
                                          opacity: resendingEmailId === reg._id ? 0.6 : 1,
                                        }}
                                      >
                                        {resendingEmailId === reg._id ? 'Sending...' : 'SEND AGAIN'}
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        disabled={resendingEmailId === reg._id}
                                        onClick={() => handleSendVerificationEmail(reg)}
                                        style={{
                                          padding: '5px 12px',
                                          backgroundColor: '#15803d',
                                          border: '1px solid #22c55e',
                                          borderRadius: '4px',
                                          color: '#ffffff',
                                          fontSize: '11.5px',
                                          fontWeight: 700,
                                          cursor: resendingEmailId === reg._id ? 'not-allowed' : 'pointer',
                                          opacity: resendingEmailId === reg._id ? 0.6 : 1,
                                        }}
                                      >
                                        {resendingEmailId === reg._id ? 'Sending...' : 'SEND EMAIL'}
                                      </button>
                                    )}

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
                                  </>
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
                                    fontSize: '11.5px',
                                    cursor: 'pointer',
                                    fontWeight: 600,
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

                {/* 2. MOBILE CARD VIEW (Visible on mobile screens or when forced via Cards toggle) */}
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

                        {/* Team / Lead Title */}
                        <div className="admin-card-title">
                          {reg.teamName || reg.leadName}
                        </div>
                        {reg.teamName && reg.leadName && reg.teamName.toLowerCase() !== reg.leadName.toLowerCase() && (
                          <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
                            Lead: <strong style={{ color: '#cbd5e1' }}>{reg.leadName}</strong>
                          </div>
                        )}

                        {/* Event, College & Member tags */}
                        <div className="admin-card-event-line">
                          <span className="admin-card-event-name">
                            🎯 {reg.eventName}
                          </span>
                          <span className="admin-card-college">
                            • {reg.leadCollege || 'PCCOE'}
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
                        <div style={{ margin: '8px 0 10px', fontSize: '12px' }}>
                          {isVerified ? (
                            reg.emailStatus === 'sent' || reg.emailSentAt ? (
                              <span style={{ color: '#4ade80', fontWeight: 600 }}>✓ Email Sent Successfully</span>
                            ) : reg.emailStatus === 'failed' ? (
                              <span style={{ color: '#f87171', fontWeight: 600 }}>⚠ Email Not Sent</span>
                            ) : (
                              <span style={{ color: '#94a3b8' }}>Email Not Sent</span>
                            )
                          ) : (
                            <span style={{ color: '#64748b' }}>Pending Verification</span>
                          )}
                        </div>

                        {/* Large Touch Actions */}
                        <div className="admin-card-actions">
                          {isVerified ? (
                            <>
                              {/* SEND / RESEND / RETRY BUTTON */}
                              {reg.emailStatus === 'sent' || reg.emailSentAt ? (
                                <button
                                  type="button"
                                  className="admin-btn-card-resend"
                                  disabled={resendingEmailId === reg._id}
                                  onClick={() => handleSendVerificationEmail(reg)}
                                  style={{
                                    padding: '8px 12px',
                                    backgroundColor: 'rgba(14, 165, 233, 0.15)',
                                    border: '1px solid rgba(14, 165, 233, 0.4)',
                                    borderRadius: '6px',
                                    color: '#38bdf8',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: resendingEmailId === reg._id ? 'not-allowed' : 'pointer',
                                  }}
                                >
                                  {resendingEmailId === reg._id ? 'Sending...' : 'RESEND EMAIL'}
                                </button>
                              ) : reg.emailStatus === 'failed' ? (
                                <button
                                  type="button"
                                  className="admin-btn-card-retry"
                                  disabled={resendingEmailId === reg._id}
                                  onClick={() => handleSendVerificationEmail(reg)}
                                  style={{
                                    padding: '8px 12px',
                                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                    border: '1px solid rgba(239, 68, 68, 0.4)',
                                    borderRadius: '6px',
                                    color: '#fca5a5',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: resendingEmailId === reg._id ? 'not-allowed' : 'pointer',
                                  }}
                                >
                                  {resendingEmailId === reg._id ? 'Sending...' : 'SEND AGAIN'}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="admin-btn-card-send"
                                  disabled={resendingEmailId === reg._id}
                                  onClick={() => handleSendVerificationEmail(reg)}
                                  style={{
                                    padding: '8px 12px',
                                    backgroundColor: '#15803d',
                                    border: '1px solid #22c55e',
                                    borderRadius: '6px',
                                    color: '#ffffff',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    cursor: resendingEmailId === reg._id ? 'not-allowed' : 'pointer',
                                  }}
                                >
                                  {resendingEmailId === reg._id ? 'Sending...' : 'SEND EMAIL'}
                                </button>
                              )}

                              <button
                                type="button"
                                className="admin-btn-card-unverify"
                                disabled={isActionBusy}
                                onClick={() => setUnverifyTarget(reg)}
                              >
                                UNVERIFY
                              </button>
                            </>
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
        )}

        {/* ── TAB 2: EVENT REGISTRATION CONTROLS ── */}
        {activeTab === 'events' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {events.map((event) => {
              const isOpen = event.registrationOpen;
              const isToggling = togglingEventId === event.id;

              return (
                <div key={event.id} className="admin-event-card">
                  {/* Left info */}
                  <div className="admin-event-card-left">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <h2 style={{ fontSize: '17px', fontWeight: 600, color: '#f8fafc', margin: 0 }}>
                        {event.name}
                      </h2>
                      <span
                        style={{
                          fontSize: '11px',
                          color: '#94a3b8',
                          backgroundColor: '#1e293b',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                        }}
                      >
                        {event.slug}
                      </span>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: isOpen ? '#22c55e' : '#ef4444',
                          }}
                        />
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            letterSpacing: '0.5px',
                            color: isOpen ? '#22c55e' : '#ef4444',
                          }}
                        >
                          {isOpen ? 'OPEN' : 'CLOSED'}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '8px', fontSize: '13px', color: '#94a3b8', flexWrap: 'wrap' }}>
                      <span>Category: <strong style={{ color: '#cbd5e1' }}>{event.category}</strong></span>
                      <span>Registrations: <strong style={{ color: '#60a5fa' }}>{event.registrationCount}</strong></span>
                      <span>Fee: <strong style={{ color: '#facc15' }}>₹{event.registrationFee}</strong></span>
                    </div>
                  </div>

                  {/* Right Controls */}
                  <div className="admin-event-card-right">
                    {/* View Attendees shortcut */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedEventFilter(event.name);
                        setActiveTab('registrations');
                      }}
                      style={{
                        padding: '9px 14px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        color: '#cbd5e1',
                        whiteSpace: 'nowrap',
                        minHeight: '40px',
                      }}
                    >
                      👥 Attendees ({event.registrationCount})
                    </button>

                    {/* Open Event Dashboard link */}
                    <a
                      href={`/admin/${event.slug}`}
                      style={{
                        padding: '9px 14px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 600,
                        backgroundColor: 'rgba(56, 189, 248, 0.12)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        color: '#38bdf8',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        whiteSpace: 'nowrap',
                        minHeight: '40px',
                      }}
                    >
                      ↗ Event Portal
                    </a>

                    {/* Action Toggle Button */}
                    <button
                      type="button"
                      disabled={isToggling}
                      onClick={() => handleToggleRegistration(event)}
                      style={{
                        padding: '9px 16px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 600,
                        letterSpacing: '0.5px',
                        cursor: isToggling ? 'not-allowed' : 'pointer',
                        opacity: isToggling ? 0.6 : 1,
                        backgroundColor: isOpen ? 'rgba(239, 68, 68, 0.12)' : 'rgba(34, 197, 94, 0.12)',
                        border: isOpen ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(34, 197, 94, 0.4)',
                        color: isOpen ? '#f87171' : '#4ade80',
                        minHeight: '40px',
                        textAlign: 'center',
                      }}
                    >
                      {isToggling
                        ? 'UPDATING...'
                        : isOpen
                        ? 'CLOSE REGISTRATION'
                        : 'OPEN REGISTRATION'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 3. REGISTRATION DETAILS MODAL ── */}
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

            {/* Team / Lead Details with Tap-to-Call/Mail */}
            <div style={{ backgroundColor: '#0a0d12', padding: '14px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #1e293b' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
                {selectedRegistration.teamName && selectedRegistration.leadName && selectedRegistration.teamName.toLowerCase() !== selectedRegistration.leadName.toLowerCase()
                  ? `Team: ${selectedRegistration.teamName}`
                  : `Participant: ${selectedRegistration.leadName || selectedRegistration.teamName}`}
              </div>
              <div style={{ fontSize: '13px', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div>Lead: <strong style={{ color: '#cbd5e1' }}>{selectedRegistration.leadName}</strong></div>
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
              This will remove them from verified participants and CSV exports.
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

      {/* ── Confirmation Dialog for Verify ── */}
      {verifyTarget && (
        <div
          className="admin-modal-overlay"
          onClick={() => setVerifyTarget(null)}
        >
          <div
            className="admin-modal-dialog"
            style={{ maxWidth: '440px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#4ade80', margin: '0 0 10px' }}>
              Confirm Verification
            </h3>
            <p style={{ fontSize: '13.5px', color: '#cbd5e1', lineHeight: '1.5', margin: '0 0 20px' }}>
              Are you sure you want to mark registration{' '}
              <strong style={{ color: '#60a5fa' }}>{verifyTarget.registrationId}</strong> (
              {verifyTarget.teamName || verifyTarget.leadName}) as <strong>VERIFIED</strong>?
            </p>

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
                {actionLoadingId === verifyTarget._id ? 'Verifying...' : 'Yes, Verify'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
