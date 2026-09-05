export type MythicCrestType = 'lotus' | 'solar' | 'chakra' | 'blade';

interface MythicCrestIconProps {
  type: MythicCrestType;
  className?: string;
}

export default function MythicCrestIcon({ type, className = '' }: MythicCrestIconProps) {
  const combinedClass = `yuga-mythic-icon ${type}-icon ${className}`.trim();

  if (type === 'lotus') {
    // Satya Yuga: Sacred Celestial Lotus & Triad Mandalas
    return (
      <svg viewBox="0 0 48 48" className={combinedClass} fill="none">
        <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1" strokeDasharray="2 3" opacity="0.6" />
        <circle cx="24" cy="24" r="14" stroke="currentColor" strokeWidth="1.2" />
        <path d="M24 8 C28 15 34 18 34 24 C34 30 24 38 24 38 C24 38 14 30 14 24 C14 18 20 15 24 8 Z" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.2" />
        <path d="M16 16 C22 20 26 22 28 28 C22 30 18 26 16 16 Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1" />
        <path d="M32 16 C26 20 22 22 20 28 C26 30 30 26 32 16 Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1" />
        <circle cx="24" cy="24" r="3" fill="currentColor" />
      </svg>
    );
  }

  if (type === 'solar') {
    // Treta Yuga: Radiant Surya Sunburst & Sacred Valor Arc
    return (
      <svg viewBox="0 0 48 48" className={combinedClass} fill="none">
        <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
        <circle cx="24" cy="24" r="10" stroke="currentColor" strokeWidth="1.4" fill="currentColor" fillOpacity="0.2" />
        <path d="M24 4 L24 10 M24 38 L24 44 M4 24 L10 24 M38 24 L44 24 M10 10 L15 15 M33 33 L38 38 M10 38 L15 33 M33 15 L38 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <polygon points="24,17 26,22 31,24 26,26 24,31 22,26 17,24 22,22" fill="currentColor" />
      </svg>
    );
  }

  if (type === 'chakra') {
    // Dwapara Yuga: Sudarshana Chakra & Duality Battlefield Blades
    return (
      <svg viewBox="0 0 48 48" className={combinedClass} fill="none">
        <circle cx="24" cy="24" r="21" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="24" cy="24" r="17" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" opacity="0.7" />
        <circle cx="24" cy="24" r="6" stroke="currentColor" strokeWidth="1.4" fill="currentColor" fillOpacity="0.3" />
        <path d="M24 3 L24 45 M3 24 L45 24 M9 9 L39 39 M9 39 L39 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
        <circle cx="24" cy="24" r="2" fill="currentColor" />
        <circle cx="24" cy="3" r="1.5" fill="currentColor" />
        <circle cx="24" cy="45" r="1.5" fill="currentColor" />
        <circle cx="3" cy="24" r="1.5" fill="currentColor" />
        <circle cx="45" cy="24" r="1.5" fill="currentColor" />
      </svg>
    );
  }

  // Kali Yuga: Kalki Twilight Star & Flaming Lightning Blade
  return (
    <svg viewBox="0 0 48 48" className={combinedClass} fill="none">
      <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1" strokeDasharray="1 3" opacity="0.5" />
      <path d="M24 4 L28 18 L42 24 L28 30 L24 44 L20 30 L6 24 L20 18 Z" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.2" />
      <path d="M24 8 L24 40 M8 24 L40 24" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
      <circle cx="24" cy="24" r="3.5" fill="currentColor" />
    </svg>
  );
}
