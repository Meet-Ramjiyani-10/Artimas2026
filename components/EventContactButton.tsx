'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getEventContacts, ContactPerson } from '@/lib/eventContacts';

interface EventContactButtonProps {
  currentEventSlug?: string;
  currentEventName?: string;
}

export default function EventContactButton({
  currentEventSlug = 'datathon',
}: EventContactButtonProps) {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState<string>(currentEventSlug);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Always sync selected event when currentEventSlug changes or modal opens
  useEffect(() => {
    if (currentEventSlug) {
      setSelectedSlug(currentEventSlug);
    }
  }, [currentEventSlug]);

  const handleOpen = () => {
    setSelectedSlug(currentEventSlug);
    setIsOpen(true);
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Lock scroll when open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!mounted) return;

    const updatePosition = () => {
      if (typeof window === 'undefined') return;
      const wrapEl = wrapRef.current;
      if (!wrapEl) return;

      const isMobile = window.innerWidth <= 768;
      const baseMargin = isMobile ? 16 : 24;
      const buttonHeight = wrapEl.offsetHeight || 52;
      const windowHeight = window.innerHeight;
      const maxBottom = Math.max(baseMargin, windowHeight - buttonHeight - 20);

      const footer = document.querySelector('.landing-footer') || document.querySelector('footer');
      if (footer) {
        const footerRect = footer.getBoundingClientRect();
        // Check how much of the footer is visible in the viewport
        if (footerRect.top < windowHeight && footerRect.bottom > 0) {
          const overlap = windowHeight - footerRect.top;
          const calculatedBottom = baseMargin + overlap;
          // Hard stop: directly pin above footer top edge without any CSS transition or animation lag
          const targetBottom = Math.min(maxBottom, Math.max(baseMargin, calculatedBottom));
          wrapEl.style.bottom = `${targetBottom}px`;
          return;
        }
      }
      wrapEl.style.bottom = `${baseMargin}px`;
    };

    // Synchronous execution on scroll events ensures immediate alignment with the footer on each frame
    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener('resize', handleScrollOrResize, { passive: true });
    // Use capture: true so scroll events from nested scroll containers like .subpage-wrapper are caught
    window.addEventListener('scroll', handleScrollOrResize, { passive: true, capture: true });

    // Also attach directly to .subpage-wrapper if present
    const subpageWrapper = document.querySelector('.subpage-wrapper');
    if (subpageWrapper) {
      subpageWrapper.addEventListener('scroll', handleScrollOrResize, { passive: true });
    }

    updatePosition();

    // Observe footer resizing so any dynamic layout changes adjust position
    const footer = document.querySelector('.landing-footer') || document.querySelector('footer');
    let resizeObserver: ResizeObserver | null = null;
    if (footer && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        updatePosition();
      });
      resizeObserver.observe(footer);
    }

    const timer = setTimeout(updatePosition, 100);

    return () => {
      clearTimeout(timer);
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, { capture: true } as any);
      if (subpageWrapper) {
        subpageWrapper.removeEventListener('scroll', handleScrollOrResize);
      }
    };
  }, [mounted]);

  const activeEventGroup = getEventContacts(selectedSlug || currentEventSlug);

  const formatPhoneDisplay = (phone: string) => {
    const clean = phone.replace(/\D/g, '');
    if (clean.length === 10) {
      return `+91 ${clean.slice(0, 5)} ${clean.slice(5)}`;
    }
    return `+91 ${phone}`;
  };

  const getCleanPhone = (phone: string) => {
    const clean = phone.replace(/\D/g, '');
    if (clean.length === 10) {
      return `91${clean}`;
    }
    return clean.startsWith('91') ? clean : `91${clean}`;
  };

  if (!mounted) {
    return null;
  }

  return createPortal(
    <>
      {/* ── Fixed Floating "Contact Us Island" (Bottom Right, dynamically adjusted to viewport & footer) ── */}
      <div
        ref={wrapRef}
        className="floating-contact-wrap"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: 'clamp(16px, 3vw, 36px)',
          zIndex: 99999,
          pointerEvents: 'auto',
          // No transition on bottom: prevents dipping into the footer and bouncing back during fast scrolling
        }}
      >
        <button
          type="button"
          onClick={handleOpen}
          aria-label={`Contact ${activeEventGroup.eventName} Event Heads`}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          className="contact-us-island-btn"
        >
          {/* Animated Gold Aura Jewel */}
          <span className="contact-island-jewel">
            <span className="contact-island-pulse" />
            <span className="contact-island-dot" />
          </span>

          {/* Headset / Phone Icon */}
          <svg
            viewBox="0 0 24 24"
            width="15"
            height="15"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="contact-island-icon"
          >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>

          <span className="contact-island-label">CONTACT US</span>

          {/* Event Badge / Tag */}
          <span className="contact-island-divider" aria-hidden="true">|</span>
          <span className="contact-island-tag">
            {activeEventGroup.eventName}
          </span>
        </button>
      </div>

      {/* ── Keyframe styles for pulsating dot, island hover & smooth modal entry ── */}
      <style jsx global>{`
        .contact-us-island-btn {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 8px 18px;
          background: rgba(8, 10, 12, 0.84);
          border: 1px solid rgba(212, 175, 55, 0.65);
          border-radius: 50px;
          color: #fef3c7;
          font-family: var(--font-body, 'Cormorant Garamond', serif);
          font-size: 13.5px;
          font-weight: 700;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          cursor: pointer;
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          box-shadow: 0 4px 22px rgba(0, 0, 0, 0.75), 0 0 16px rgba(212, 175, 55, 0.25), inset 0 0 10px rgba(8, 10, 12, 0.6);
          user-select: none;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          outline: none;
        }

        .contact-us-island-btn:hover {
          transform: translateY(-2px) scale(1.03);
          border-color: #fde047;
          background: rgba(18, 14, 8, 0.92);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.85), 0 0 24px rgba(212, 175, 55, 0.45);
          color: #ffffff;
        }

        .contact-island-jewel {
          position: relative;
          display: flex;
          width: 8px;
          height: 8px;
          flex-shrink: 0;
        }

        .contact-island-pulse {
          position: absolute;
          display: inline-flex;
          height: 100%;
          width: 100%;
          border-radius: 50%;
          background-color: #fbbf24;
          opacity: 0.75;
          animation: contactPulse 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        .contact-island-dot {
          position: relative;
          display: inline-flex;
          border-radius: 50%;
          width: 8px;
          height: 8px;
          background-color: #f59e0b;
        }

        .contact-island-icon {
          color: #fbbf24;
          flex-shrink: 0;
        }

        .contact-island-divider {
          color: rgba(212, 175, 55, 0.4);
          font-weight: 300;
          font-size: 13px;
        }

        .contact-island-tag {
          font-size: 11.5px;
          font-weight: 700;
          color: #fbbf24;
          letter-spacing: 0.8px;
          max-width: 160px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        @keyframes contactPulse {
          0% {
            transform: scale(0.95);
            opacity: 0.8;
          }
          70% {
            transform: scale(2.3);
            opacity: 0;
          }
          100% {
            transform: scale(2.3);
            opacity: 0;
          }
        }
        @keyframes contactModalIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .contact-list-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .contact-list-scroll::-webkit-scrollbar-thumb {
          background: rgba(212, 175, 55, 0.35);
          border-radius: 4px;
        }
        @media (max-width: 768px) {
          .floating-contact-wrap {
            right: 14px !important;
          }
          .contact-us-island-btn {
            padding: 8px 14px !important;
            font-size: 12px !important;
            gap: 7px !important;
          }
          .contact-island-divider,
          .contact-island-tag {
            display: none !important;
          }
        }
      `}</style>

      {/* ── Modal Pop-up ── */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 100000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '490px',
              maxHeight: '88vh',
              background: 'linear-gradient(178deg, #1d0f06 0%, #120702 55%, #080301 100%)',
              border: '1.5px solid #d4af37',
              borderRadius: '12px',
              boxShadow: '0 25px 65px rgba(0, 0, 0, 0.9), 0 0 35px rgba(212, 175, 55, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'contactModalIn 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
              position: 'relative',
            }}
          >
            {/* Top Ancient Gold Trim Bar */}
            <div
              style={{
                height: '3px',
                background: 'linear-gradient(90deg, transparent, #fbbf24, #d4af37, #fbbf24, transparent)',
                width: '100%',
              }}
            />

            {/* Header: Specifically Brand to the Active Event */}
            <div
              style={{
                padding: '16px 20px 12px',
                borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '12px',
                background: 'rgba(0, 0, 0, 0.25)',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '1.5px',
                    color: '#fbbf24',
                    textTransform: 'uppercase',
                    marginBottom: '3px',
                  }}
                >
                  <span>✦</span>
                  <span>{activeEventGroup.eventName.toUpperCase()} TRIAL SUPPORT</span>
                  <span>✦</span>
                </div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#fef3c7',
                    letterSpacing: '0.5px',
                    fontFamily: 'serif',
                  }}
                >
                  {activeEventGroup.eventName.toUpperCase()} HEADS
                </h2>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close contact menu"
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  color: '#fde68a',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(212, 175, 55, 0.25)';
                  e.currentTarget.style.borderColor = '#fbbf24';
                  e.currentTarget.style.transform = 'rotate(90deg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.3)';
                  e.currentTarget.style.transform = 'rotate(0deg)';
                }}
              >
                ✕
              </button>
            </div>

            {/* Contact List */}
            <div
              className="contact-list-scroll"
              style={{
                padding: '16px 18px',
                overflowY: 'auto',
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '4px',
                }}
              >
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    letterSpacing: '1px',
                    color: '#fef3c7',
                    textTransform: 'uppercase',
                  }}
                >
                  {activeEventGroup.eventName} Coordinators
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    color: '#fef3c7',
                    background: 'rgba(212, 175, 55, 0.12)',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    border: '1px solid rgba(212, 175, 55, 0.25)',
                  }}
                >
                  {activeEventGroup.heads.length} Heads
                </span>
              </div>

              {activeEventGroup.heads.map((head: ContactPerson) => {
                const cleanPhone = getCleanPhone(head.phone);
                const initial = head.name.charAt(0).toUpperCase();

                return (
                  <div
                    key={head.name + head.phone}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      background: 'rgba(38, 20, 10, 0.45)',
                      border: '1px solid rgba(212, 175, 55, 0.2)',
                      transition: 'border-color 0.2s ease, background 0.2s ease',
                      gap: '10px',
                    }}
                  >
                    {/* Left: Avatar + Name + Phone */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.25), rgba(161, 98, 7, 0.35))',
                          border: '1.5px solid #d4af37',
                          color: '#fbbf24',
                          fontWeight: 700,
                          fontSize: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          fontFamily: 'serif',
                        }}
                      >
                        {initial}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              color: '#fffbeb',
                              fontWeight: 700,
                              fontSize: '14.5px',
                              letterSpacing: '0.3px',
                            }}
                          >
                            {head.name}
                          </span>
                          <span
                            style={{
                              fontSize: '9.5px',
                              fontWeight: 600,
                              color: '#fbbf24',
                              border: '1px solid rgba(251, 191, 36, 0.35)',
                              borderRadius: '4px',
                              padding: '1px 5px',
                              letterSpacing: '0.5px',
                            }}
                          >
                            HEAD
                          </span>
                        </div>
                        <div
                          style={{
                            color: '#fef3c7',
                            fontSize: '12.5px',
                            fontFamily: 'monospace',
                            letterSpacing: '0.5px',
                            marginTop: '2px',
                          }}
                        >
                          {formatPhoneDisplay(head.phone)}
                        </div>
                      </div>
                    </div>

                    {/* Right: Quick Action Buttons (Call + WhatsApp) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      {/* Call Button */}
                      <a
                        href={`tel:${head.phone}`}
                        aria-label={`Call ${head.name}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px',
                          background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.22), rgba(161, 98, 7, 0.28))',
                          border: '1px solid #d4af37',
                          color: '#fef3c7',
                          padding: '7px 11px',
                          borderRadius: '6px',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          textDecoration: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#d4af37';
                          e.currentTarget.style.color = '#120701';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(212, 175, 55, 0.22), rgba(161, 98, 7, 0.28))';
                          e.currentTarget.style.color = '#fef3c7';
                        }}
                      >
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                        <span>CALL</span>
                      </a>

                      {/* WhatsApp Button */}
                      <a
                        href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                          `Hi ${head.name}, I have a query regarding ${activeEventGroup.eventName} at ARTIMAS 2026.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`WhatsApp ${head.name}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px',
                          background: 'rgba(37, 211, 102, 0.18)',
                          border: '1px solid #22c55e',
                          color: '#4ade80',
                          padding: '7px 11px',
                          borderRadius: '6px',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          textDecoration: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#22c55e';
                          e.currentTarget.style.color = '#042f14';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(37, 211, 102, 0.18)';
                          e.currentTarget.style.color = '#4ade80';
                        }}
                      >
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                          <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 1.67c4.54 0 8.24 3.7 8.24 8.24 0 2.2-.86 4.27-2.42 5.82a8.196 8.196 0 0 1-5.82 2.41c-1.47 0-2.91-.39-4.17-1.14l-.3-.18-3.12.82.83-3.04-.2-.31a8.216 8.216 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24zm4.5 11.64c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.07-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.44.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.22-.16-.47-.29z" />
                        </svg>
                        <span>CHAT</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
}
