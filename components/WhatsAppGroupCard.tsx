'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { getEventWhatsAppGroup } from '@/lib/whatsappGroups';

interface WhatsAppGroupCardProps {
  eventSlug: string;
  eventName: string;
  customUrl?: string;
}

export default function WhatsAppGroupCard({
  eventSlug,
  eventName,
  customUrl,
}: WhatsAppGroupCardProps) {
  const group = getEventWhatsAppGroup(eventSlug, eventName);
  const targetUrl = customUrl || group.url;

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function generateQR() {
      try {
        const url = await QRCode.toDataURL(targetUrl, {
          width: 360,
          margin: 2,
          color: {
            dark: '#111827',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'M',
        });
        if (isMounted) {
          setQrDataUrl(url);
        }
      } catch (err) {
        console.error('Error generating QR code:', err);
        // Fallback to qrserver URL if client generation fails
        if (isMounted) {
          setQrDataUrl(
            `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
              targetUrl
            )}`
          );
        }
      }
    }

    generateQR();

    return () => {
      isMounted = false;
    };
  }, [targetUrl]);

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(targetUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = targetUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy WhatsApp link:', err);
    }
  };

  return (
    <div
      style={{
        background: 'linear-gradient(145deg, rgba(16, 32, 22, 0.95), rgba(8, 18, 12, 0.98))',
        border: '1.5px solid #22c55e',
        borderRadius: '8px',
        padding: '16px 14px',
        margin: '14px 0',
        textAlign: 'center',
        boxShadow: '0 6px 20px rgba(34, 197, 94, 0.16)',
        color: '#f0fdf4',
      }}
    >
      {/* WhatsApp Header Badge */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: 'rgba(34, 197, 94, 0.16)',
          border: '1px solid rgba(34, 197, 94, 0.5)',
          padding: '4px 10px',
          borderRadius: '16px',
          marginBottom: '8px',
        }}
      >
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="#25D366"
          style={{ display: 'block', flexShrink: 0 }}
        >
          <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 1.67c4.54 0 8.24 3.7 8.24 8.24 0 2.2-.86 4.27-2.42 5.82a8.196 8.196 0 0 1-5.82 2.41c-1.47 0-2.91-.39-4.17-1.14l-.3-.18-3.12.82.83-3.04-.2-.31a8.216 8.216 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24zm4.5 11.64c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.07-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.44.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.22-.16-.47-.29z" />
        </svg>
        <span
          style={{
            fontSize: '10.5px',
            fontWeight: 700,
            letterSpacing: '1px',
            color: '#4ade80',
            textTransform: 'uppercase',
          }}
        >
          OFFICIAL WHATSAPP COMMUNITY
        </span>
      </div>

      <h3
        style={{
          margin: '0 0 4px',
          fontSize: '16px',
          fontWeight: 700,
          color: '#ffffff',
          letterSpacing: '0.5px',
        }}
      >
        JOIN THE {eventName.toUpperCase()} WHATSAPP GROUP
      </h3>

      <p
        style={{
          margin: '0 auto 12px',
          maxWidth: '440px',
          fontSize: '12px',
          color: '#bbf7d0',
          lineHeight: '1.45',
        }}
      >
        Scan the QR code below or tap the button to receive real-time trial schedules, slot allocations, and critical announcements.
      </p>

      {/* QR Code Container */}
      <div
        style={{
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ffffff',
          padding: '10px',
          borderRadius: '10px',
          border: '2px solid rgba(34, 197, 94, 0.4)',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)',
          marginBottom: '12px',
        }}
      >
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt={`${eventName} WhatsApp Group QR Code`}
            style={{
              width: '145px',
              height: '145px',
              display: 'block',
              borderRadius: '4px',
            }}
          />
        ) : (
          <div
            style={{
              width: '145px',
              height: '145px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6b7280',
              fontSize: '11.5px',
            }}
          >
            Generating QR Code...
          </div>
        )}
        <span
          style={{
            marginTop: '6px',
            fontSize: '10.5px',
            fontWeight: 600,
            color: '#15803d',
            letterSpacing: '0.5px',
          }}
        >
          SCAN WITH WHATSAPP CAMERA
        </span>
      </div>

      {/* Direct WhatsApp Action Button */}
      <div style={{ maxWidth: '340px', margin: '0 auto 10px' }}>
        <a
          href={targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            backgroundColor: '#25D366',
            color: '#062810',
            fontWeight: 700,
            fontSize: '13.5px',
            padding: '10px 18px',
            borderRadius: '6px',
            textDecoration: 'none',
            letterSpacing: '0.5px',
            boxShadow: '0 4px 12px rgba(37, 211, 102, 0.35)',
            transition: 'transform 0.2s ease, background-color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#22c55e';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#25D366';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 1.67c4.54 0 8.24 3.7 8.24 8.24 0 2.2-.86 4.27-2.42 5.82a8.196 8.196 0 0 1-5.82 2.41c-1.47 0-2.91-.39-4.17-1.14l-.3-.18-3.12.82.83-3.04-.2-.31a8.216 8.216 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24zm4.5 11.64c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.07-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.44.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.22-.16-.47-.29z" />
          </svg>
          JOIN WHATSAPP GROUP ↗
        </a>
      </div>

      {/* Direct Link + Copy Link */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          fontSize: '11.5px',
          color: '#86efac',
        }}
      >
        <span style={{ color: '#86efac', opacity: 0.85 }}>Direct link:</span>
        <a
          href={targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: '#4ade80',
            textDecoration: 'underline',
            fontFamily: 'monospace',
            fontSize: '11.5px',
            wordBreak: 'break-all',
          }}
        >
          {targetUrl}
        </a>
        <button
          type="button"
          onClick={handleCopyLink}
          style={{
            background: 'rgba(34, 197, 94, 0.2)',
            border: '1px solid rgba(34, 197, 94, 0.4)',
            color: '#f0fdf4',
            padding: '2px 8px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '10.5px',
            fontWeight: 600,
          }}
        >
          {copied ? 'COPIED' : 'COPY'}
        </button>
      </div>

      {/* Helpful footnote */}
      <p
        style={{
          margin: '10px 0 0',
          fontSize: '11px',
          color: 'rgba(240, 253, 244, 0.7)',
        }}
      >
        Note: Joining the group is mandatory for all registered participants to receive event schedules and updates.
      </p>
    </div>
  );
}
