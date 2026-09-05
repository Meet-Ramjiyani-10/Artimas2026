'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';

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
  const [selectedRegistration, setSelectedRegistration] = useState<RegistrationItem | null>(null);
  const [unverifyTarget, setUnverifyTarget] = useState<RegistrationItem | null>(null);

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
            r._id === reg._id ? { ...r, verified: true, status: 'APPROVED' } : r
          )
        );
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
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
            padding: '32px 28px',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
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
                  fontSize: '14px',
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
                  fontSize: '14px',
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
            <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '1px', color: '#f8fafc', margin: '0 0 4px' }}>
              ARTIMAS 26 ADMIN PORTAL
            </h1>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
              Festival Registration Management & Data Explorer
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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

        {/* ── Key Metrics Cards Banner (Enhanced with 5 core stats) ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '14px',
            marginBottom: '24px',
          }}
        >
          {/* Total Registrations */}
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
              {stats?.totalRegistrations ?? stats?.total ?? registrations.length}
            </div>
          </div>

          {/* Total Verified */}
          <div
            style={{
              backgroundColor: '#111722',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              padding: '16px 20px',
            }}
          >
            <span style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Verified
            </span>
            <div style={{ fontSize: '26px', fontWeight: 700, color: '#22c55e', marginTop: '4px' }}>
              {stats?.totalVerified ?? stats?.approved ?? registrations.filter((r) => r.verified || r.status === 'APPROVED').length}
            </div>
          </div>

          {/* Total Unverified */}
          <div
            style={{
              backgroundColor: '#111722',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              padding: '16px 20px',
            }}
          >
            <span style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Unverified
            </span>
            <div style={{ fontSize: '26px', fontWeight: 700, color: '#f59e0b', marginTop: '4px' }}>
              {stats?.totalUnverified ?? registrations.filter((r) => !r.verified && r.status !== 'APPROVED').length}
            </div>
          </div>

          {/* Total Revenue */}
          <div
            style={{
              backgroundColor: '#111722',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              padding: '16px 20px',
            }}
          >
            <span style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Revenue
            </span>
            <div style={{ fontSize: '26px', fontWeight: 700, color: '#facc15', marginTop: '4px' }}>
              ₹{stats?.totalRevenue ?? registrations.reduce((sum, r) => sum + (r.amount || 0), 0)}
            </div>
          </div>

          {/* Total Events */}
          <div
            style={{
              backgroundColor: '#111722',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              padding: '16px 20px',
            }}
          >
            <span style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Events
            </span>
            <div style={{ fontSize: '26px', fontWeight: 700, color: '#60a5fa', marginTop: '4px' }}>
              {stats?.totalEvents ?? events.length}
            </div>
          </div>
        </div>

        {/* ── Navigation Tabs ── */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #1e293b',
            marginBottom: '20px',
            gap: '8px',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('registrations')}
            style={{
              padding: '10px 18px',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'registrations' ? '2px solid #3b82f6' : '2px solid transparent',
              color: activeTab === 'registrations' ? '#f8fafc' : '#94a3b8',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            📋 Registrations ({filteredRegistrations.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('events')}
            style={{
              padding: '10px 18px',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'events' ? '2px solid #3b82f6' : '2px solid transparent',
              color: activeTab === 'events' ? '#f8fafc' : '#94a3b8',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            ⚙️ Event Controls ({events.length})
          </button>
        </div>

        {/* ── TAB 1: REGISTRATIONS EXPLORER ── */}
        {activeTab === 'registrations' && (
          <div>
            {/* Filter & Action Controls Bar */}
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
                {/* Search Bar */}
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by ID, name, email, college, phone..."
                  style={{
                    backgroundColor: '#0a0d12',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: '#ffffff',
                    fontSize: '13px',
                    minWidth: '240px',
                    flex: '1 1 240px',
                    outline: 'none',
                  }}
                />

                {/* Event Filter */}
                <select
                  value={selectedEventFilter}
                  onChange={(e) => setSelectedEventFilter(e.target.value)}
                  style={{
                    backgroundColor: '#0a0d12',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: '#e2e8f0',
                    fontSize: '13px',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
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
                  style={{
                    backgroundColor: '#0a0d12',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: '#e2e8f0',
                    fontSize: '13px',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="ALL">All Verification</option>
                  <option value="VERIFIED">Verified Only</option>
                  <option value="UNVERIFIED">Unverified Only</option>
                </select>

                {/* PCCOE Filter */}
                <select
                  value={selectedPccoeFilter}
                  onChange={(e) => setSelectedPccoeFilter(e.target.value)}
                  style={{
                    backgroundColor: '#0a0d12',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: '#e2e8f0',
                    fontSize: '13px',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="ALL">All Colleges</option>
                  <option value="PCCOE">PCCOE Verified (Free)</option>
                  <option value="EXTERNAL">External Colleges (Paid)</option>
                </select>
              </div>

              {/* Action Buttons: Export Verified CSV + Full CSV */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleExportVerifiedCSV}
                  style={{
                    padding: '8px 14px',
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
                  📥 EXPORT VERIFIED CSV ({filteredRegistrations.filter((r) => r.verified || r.status === 'APPROVED').length})
                </button>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  style={{
                    padding: '8px 14px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    color: '#cbd5e1',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  📥 EXPORT ALL ({filteredRegistrations.length})
                </button>
              </div>
            </div>

            {/* Registrations Data Table */}
            {isLoading && registrations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
                Loading registrations...
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
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>EVENT</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>LEAD / TEAM</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>CONTACT</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>COLLEGE</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>MEMBERS</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>FEE</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>STATUS</th>
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
                          <td style={{ padding: '12px 16px', fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap' }}>
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
                          <td style={{ padding: '12px 16px', fontWeight: 600, color: '#cbd5e1' }}>
                            {reg.eventName}
                          </td>
                          <td style={{ padding: '12px 16px', color: '#e2e8f0' }}>
                            <div style={{ fontWeight: 600 }}>{reg.teamName || reg.leadName}</div>
                            {reg.teamName && reg.leadName && reg.teamName.toLowerCase() !== reg.leadName.toLowerCase() && (
                              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Lead: {reg.leadName}</div>
                            )}
                          </td>
                          <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '12px' }}>
                            <div>{reg.leadEmail}</div>
                            <div>{reg.leadPhone}</div>
                          </td>
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
                          <td style={{ padding: '12px 16px', color: '#94a3b8', textAlign: 'center' }}>
                            {reg.members?.length || 1}
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                            {reg.amount === 0 ? (
                              <span style={{ color: '#22c55e' }}>₹0</span>
                            ) : (
                              <span style={{ color: '#facc15' }}>₹{reg.amount}</span>
                            )}
                          </td>
                          <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                            {isVerified ? (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  color: '#22c55e',
                                  backgroundColor: 'rgba(34, 197, 94, 0.12)',
                                  border: '1px solid rgba(34, 197, 94, 0.3)',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  fontSize: '11.5px',
                                  fontWeight: 700,
                                }}
                              >
                                ✓ VERIFIED
                              </span>
                            ) : (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  color: '#f59e0b',
                                  backgroundColor: 'rgba(245, 158, 11, 0.12)',
                                  border: '1px solid rgba(245, 158, 11, 0.3)',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  fontSize: '11.5px',
                                  fontWeight: 700,
                                }}
                              >
                                ● UNVERIFIED
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '12px 16px', whiteSpace: 'nowrap', textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              {isVerified ? (
                                <button
                                  type="button"
                                  disabled={isActionBusy}
                                  onClick={() => setUnverifyTarget(reg)}
                                  style={{
                                    padding: '5px 8px',
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: '4px',
                                    color: '#f87171',
                                    fontSize: '11.5px',
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
                                    padding: '5px 10px',
                                    backgroundColor: '#166534',
                                    border: '1px solid #22c55e',
                                    borderRadius: '4px',
                                    color: '#ffffff',
                                    fontSize: '11.5px',
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
                <div
                  key={event.id}
                  style={{
                    backgroundColor: '#111722',
                    border: '1px solid #1e293b',
                    borderRadius: '8px',
                    padding: '18px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    flexWrap: 'wrap',
                  }}
                >
                  {/* Left info */}
                  <div style={{ minWidth: '220px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '6px', fontSize: '13px', color: '#94a3b8' }}>
                      <span>Category: <strong style={{ color: '#cbd5e1' }}>{event.category}</strong></span>
                      <span>Registrations: <strong style={{ color: '#60a5fa' }}>{event.registrationCount}</strong></span>
                      <span>Fee: <strong style={{ color: '#facc15' }}>₹{event.registrationFee}</strong></span>
                    </div>
                  </div>

                  {/* Right Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {/* Status indicator */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: isOpen ? '#22c55e' : '#ef4444',
                          boxShadow: isOpen ? '0 0 8px #22c55e' : 'none',
                        }}
                      />
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          letterSpacing: '1px',
                          color: isOpen ? '#22c55e' : '#ef4444',
                        }}
                      >
                        {isOpen ? 'OPEN' : 'CLOSED'}
                      </span>
                    </div>

                    {/* View Attendees shortcut */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedEventFilter(event.name);
                        setActiveTab('registrations');
                      }}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        color: '#cbd5e1',
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      👥 View Attendees ({event.registrationCount})
                    </button>

                    {/* Open Event Dashboard link */}
                    <a
                      href={`/admin/${event.slug}`}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 600,
                        backgroundColor: 'rgba(56, 189, 248, 0.12)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        color: '#38bdf8',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        whiteSpace: 'nowrap',
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
                        padding: '10px 18px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 600,
                        letterSpacing: '0.5px',
                        cursor: isToggling ? 'not-allowed' : 'pointer',
                        opacity: isToggling ? 0.6 : 1,
                        backgroundColor: isOpen ? 'rgba(239, 68, 68, 0.12)' : 'rgba(34, 197, 94, 0.12)',
                        border: isOpen ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(34, 197, 94, 0.4)',
                        color: isOpen ? '#f87171' : '#4ade80',
                        transition: 'all 0.2s',
                        minWidth: '180px',
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

            {/* Team / Lead Details */}
            <div style={{ backgroundColor: '#0a0d12', padding: '14px', borderRadius: '6px', marginBottom: '16px', border: '1px solid #1e293b' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', marginBottom: '6px' }}>
                {selectedRegistration.teamName && selectedRegistration.leadName && selectedRegistration.teamName.toLowerCase() !== selectedRegistration.leadName.toLowerCase()
                  ? `Team: ${selectedRegistration.teamName}`
                  : `Participant: ${selectedRegistration.leadName || selectedRegistration.teamName}`}
              </div>
              <div style={{ fontSize: '13px', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div>Lead: <strong style={{ color: '#cbd5e1' }}>{selectedRegistration.leadName}</strong></div>
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
              This will remove them from verified participants and CSV exports.
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
    </div>
  );
}
