'use client';

import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface AdminEvent {
  id: string;
  name: string;
  slug: string;
  category: string;
  yuga: string;
  registrationOpen: boolean;
  active: boolean;
  registrationCount: number;
}

export default function AdminPortal() {
  const [token, setToken] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

  // Login form state
  const [password, setPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Dashboard state
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(false);
  const [eventsError, setEventsError] = useState<string>('');
  const [togglingEventId, setTogglingEventId] = useState<string | null>(null);

  // Check saved token on mount
  useEffect(() => {
    const savedToken = typeof window !== 'undefined' ? sessionStorage.getItem('artimas_admin_token') : null;
    if (savedToken) {
      setToken(savedToken);
    }
    setIsCheckingAuth(false);
  }, []);

  // Fetch events list
  const fetchEvents = useCallback(async (authToken: string) => {
    setIsLoadingEvents(true);
    setEventsError('');
    try {
      const res = await fetch(`${API_BASE}/admin/events`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (res.status === 401 || res.status === 403) {
        // Token expired or invalid
        sessionStorage.removeItem('artimas_admin_token');
        setToken(null);
        setLoginError('Session expired. Please log in again.');
        return;
      }

      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setEvents(json.data);
      } else {
        setEventsError(json.message || 'Failed to load events');
      }
    } catch {
      setEventsError('Unable to connect to backend server');
    } finally {
      setIsLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchEvents(token);
    }
  }, [token, fetchEvents]);

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
        body: JSON.stringify({ password: password.trim() }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setLoginError(json.message || 'Invalid password');
        return;
      }

      const receivedToken = json.data?.token;
      if (receivedToken) {
        sessionStorage.setItem('artimas_admin_token', receivedToken);
        setToken(receivedToken);
        setPassword('');
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
    setToken(null);
    setEvents([]);
    setPassword('');
    setLoginError('');
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
        // Update local event state
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
            <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '2px', color: '#f8fafc', margin: '0 0 6px' }}>
              ARTIMAS 26
            </h1>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Admin Portal
            </p>
          </div>

          <form onSubmit={handleLogin} noValidate>
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
                  transition: 'border-color 0.2s',
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
                transition: 'background-color 0.2s',
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
        padding: '32px 20px',
      }}
    >
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        {/* Top Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #1e293b',
            paddingBottom: '20px',
            marginBottom: '28px',
          }}
        >
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '1px', color: '#f8fafc', margin: '0 0 4px' }}>
              EVENT MANAGEMENT
            </h1>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
              ARTIMAS 26 — Festival Registration Controls
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              type="button"
              onClick={() => fetchEvents(token)}
              disabled={isLoadingEvents}
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
              {isLoadingEvents ? 'REFRESHING...' : '↻ REFRESH'}
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

        {eventsError && (
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '6px',
              padding: '12px 16px',
              color: '#f87171',
              fontSize: '14px',
              marginBottom: '24px',
            }}
          >
            ⚠ {eventsError}
          </div>
        )}

        {/* Events List */}
        {isLoadingEvents && events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
            Loading events...
          </div>
        ) : (
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
                    transition: 'border-color 0.2s',
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
    </div>
  );
}
