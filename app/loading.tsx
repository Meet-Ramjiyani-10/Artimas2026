export default function Loading() {
  return (
    <div className="mythic-page-loader" aria-live="polite" aria-busy="true">
      <div className="loader-backdrop" />
      <div className="loader-glow-orb" />

      <div className="loader-content">
        <div className="astrolabe-spinner">
          <div className="astrolabe-ring outer-ring" />
          <div className="astrolabe-ring middle-ring" />
          <div className="astrolabe-ring inner-ring" />
          <div className="astrolabe-core">
            <span className="core-glyph">☸</span>
          </div>
        </div>

        <div className="loader-mantra">॥ कालचक्रं प्रवर्तते ॥</div>
        <h2 className="loader-title">UNVEILING THE REALM</h2>

        <div className="loader-progress-track">
          <div className="loader-progress-shimmer" />
        </div>
      </div>
    </div>
  );
}
