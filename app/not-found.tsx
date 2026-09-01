import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      textAlign: 'center',
      padding: '20px',
      color: 'var(--text-parchment)',
      fontFamily: 'var(--font-body)',
    }}>
      <h1 style={{ fontSize: '48px', color: 'var(--heading-ivory)', marginBottom: '16px', fontFamily: 'var(--font-title)' }}>404</h1>
      <p style={{ marginBottom: '24px', fontSize: '16px' }}>Epoch or Chamber Not Found in the Cosmic Cycle.</p>
      <Link
        href="/"
        style={{
          padding: '10px 24px',
          background: 'rgba(58, 36, 21, 0.75)',
          border: '1px solid var(--btn-border-gold)',
          borderRadius: '4px',
          color: 'var(--heading-ivory)',
          textDecoration: 'none',
          fontFamily: 'var(--font-body)',
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        ← Return Home
      </Link>
    </div>
  );
}
