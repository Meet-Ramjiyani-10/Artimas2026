# Artimas 2026 — Project Context & Architectural Documentation

> **Artimas** is a next-generation, immersive web experience blending ancient Indian cosmic mythology with state-of-the-art 3D graphics, parallax depth rendering, and cinematic video transitions. It serves as the grand portal for the Artimas 2026 technological and cultural festival.

---

## 1. Project Overview & Vision

Artimas transports participants across the **Four Cosmic Epochs (The Yugas)** through an interactive 3D Chakra Medallion (The Wheel of Time), ambient particle physics, multi-layer depth parallax, and 3D Coverflow carousel stages.

### Core Experience Highlights:
- **Landing Horizon**: Mystical temple pillars, celestial background, glowing brand logo, and a rotating 3D Chakra Medallion.
- **Enter The Yugas (`mode-yugas`)**: The wheel descends into the cosmic horizon, transitioning seamlessly between living video landscapes corresponding to each mythological epoch.
- **Navigation Islands**: Top-right floating glass pills providing instant subpage navigation to **Events**, **Team**, **Sponsors**, and **Calendar**.
- **3D Coverflow Stages**: Hardware-accelerated 3D carousel systems for festival chronicles (Events) and council members (Team) with fluid cinematic physics and auto-rotation.

---

## 2. Technology Stack

| Domain | Technology / Library | Role & Details |
|---|---|---|
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router) | Server-side rendering, static generation, modern routing, and Turbopack dev tooling |
| **UI Runtime** | [React 19](https://react.dev/) | Component architecture, state hooks, and optimized concurrent DOM rendering |
| **Language** | [TypeScript 5.8+](https://www.typescriptlang.org/) | Strict type safety, interfaces, and autocompletion across components and media schemas |
| **Styling** | Custom Vanilla CSS (`globals.css`) | Custom design system, CSS 3D transforms (`perspective`, `rotateY`, `translateZ`), and glassmorphic tokens |
| **3D Rendering** | [@google/model-viewer](https://modelviewer.dev/) | Web component rendering `chakra_medallion.glb` with WebGL/PBR lighting and zero shadow overhead |
| **Particle Physics** | HTML5 2D Canvas API | 60fps dynamic ember and celestial particle simulation with flicker and drift algorithms |
| **Media CDN** | [Cloudinary](https://cloudinary.com/) | Edge-cached video delivery and on-the-fly image optimization (`f_auto,q_auto,w_...,c_limit`) |
| **Typography** | Google Fonts (`next/font/google`) | *Cinzel* (Mythological serif titles) and *Hanken Grotesk* (Clean modern sans-serif body) |

---

## 3. Directory Structure

```text
ActualArtimas26/
├── app/
│   ├── calendar/
│   │   └── page.tsx              # Day-by-day festival schedule & milestones
│   ├── events/
│   │   └── page.tsx              # 3D Coverflow scroll carousel of festival events
│   ├── sponsors/
│   │   └── page.tsx              # Patrons, cloud partners, and hardware guilds
│   ├── team/
│   │   └── page.tsx              # 10-member auto-rolling 3D Coverflow council carousel
│   ├── globals.css               # Core design tokens, parallax layers, 3D carousel styles
│   ├── layout.tsx                # Root layout, Google Fonts (Cinzel, Hanken Grotesk), metadata
│   ├── not-found.tsx             # Custom 404 cosmic epoch not found page
│   └── page.tsx                  # Home route — renders <ArtimasScene />
├── components/
│   ├── ArtimasScene.tsx          # Main landing state controller, Yugas transition & video engine
│   ├── ChakraMedallion.tsx       # <model-viewer> 3D component with dynamic on-demand script loading
│   ├── NavIslands.tsx            # Top-right quick-navigation pills with route prefetching
│   ├── ParticleCanvas.tsx        # High-performance 2D canvas cosmic ember system
│   ├── ScrollCarousel.tsx        # 3D Coverflow scroll carousel for Events showcase
│   ├── SubpageLayout.tsx         # Unified subpage shell (topbar, parallax background, particles)
│   └── TeamCarousel.tsx          # 10-card auto-rolling 3D Coverflow team carousel
├── lib/
│   └── media.ts                  # Central media registry with Cloudinary optimization params
├── next.config.ts                # Next.js configuration (unoptimized images for CDN, tracing root)
├── package.json                  # Dependencies, Turbopack dev script, and build targets
├── tsconfig.json                 # TypeScript compiler paths and strict configuration
└── context.md                    # Project context & architecture documentation
```

---

## 4. Cosmic Epochs (The Four Yugas)

The application cycles through four mythological epochs, each mapped to a specific wheel rotation angle, title emblem, and living video background:

| Epoch | Angle | Normalized Angle | Video Asset | Theme & Narrative |
|---|---|---|---|---|
| **Satya Yuga** | `0°` / `720°+` | `0°` | `Satyayug.mp4` | Era of Truth, pure golden enlightenment, and genesis. |
| **Treta Yuga** | `+90°` | `90°` | `Tretayug_enhanced.mp4` | Era of Righteousness, ritual flame, and divine order. |
| **Dwapara Yuga** | `+180°` | `180°` | `Dwaparayug_enhanced.mp4` | Era of Energy, duality, technological duels, and crucible tests. |
| **Kali Yuga** | `+270°` | `270°` | `Kalyug.mp4` | Era of Darkness and Transformation, cybernetic future, and cosmic ascendance. |

---

## 5. Media & CDN Architecture (`lib/media.ts`)

All media is hosted on Cloudinary (`res.cloudinary.com/qllarlul/`) and managed centrally via [`lib/media.ts`](file:///c:/Users/haric/Desktop/ActualArtimas26/lib/media.ts).

### Automated CDN Transformations:
- `f_auto`: Automatically converts images to WebP/AVIF and videos to H.264/VP9/AV1 based on the client browser.
- `q_auto`: Dynamic perceptual compression tuning for minimal bandwidth without visual loss.
- `w_...,c_limit`: Strict bounding box dimension limits (e.g. `w_950,c_limit` for carousel cards, `w_1920,c_limit` for 4K backgrounds) reducing payload sizes by **>75%**.

```typescript
export const MEDIA = {
  videos: {
    satyug: '.../video/upload/f_auto,q_auto/v1788219763/Satyayug.mp4',
    treta:  '.../video/upload/f_auto,q_auto/v1788219875/Tretayug_enhanced.mp4',
    dwapar: '.../video/upload/f_auto,q_auto/v1788219861/Dwaparayug_enhanced.mp4',
    kalyug: '.../video/upload/f_auto,q_auto/v1788219744/Kalyug.mp4',
  },
  models: {
    chakraMedallion: '.../image/upload/v1788219745/chakra_medallion.glb',
  },
  images: {
    logo: '.../f_auto,q_auto,w_500,c_limit/.../logo.png',
    bgImage: '.../f_auto,q_auto,w_1920,c_limit/.../bg_image.png',
    pillar: '.../f_auto,q_auto,w_1000,c_limit/.../layer_1_pillar.png',
    scroll: '.../f_auto,q_auto,w_950,c_limit/.../scroll_without_background.png',
    teamCard: '.../f_auto,q_auto,w_950,c_limit/.../Untitled_-_01_September_2026_at_05.43.34.png',
    yugaTitles: { ... },
  },
};
```

---

## 6. Key Components Breakdown

### 1. `ArtimasScene.tsx`
- Manages dual-mode viewport: **Landing Mode** vs **Yugas Mode** (`mode-yugas`).
- Supports multi-input rotation: Mouse wheel, vertical swipe touch gestures, keyboard arrows (`←`/`→`/`↑`/`↓`/`Enter`), and numeric keys (`1`, `2`, `3`, `4`).
- Controls seamless cross-fading of high-definition epoch background videos with `play()`/`pause()` safety buffers to prevent memory leaks.

### 2. `TeamCarousel.tsx`
- Holds 10 team member cards in circular rotating 3D Coverflow order.
- **Auto-Roll Engine**: Automatically rotates every `2100ms` (1.5x speed).
- **Smart Pause**: Pauses rotation on mouse hover and touch interactions; respects `document.hidden` so transitions do not queue up when the tab is backgrounded.
- **Multi-Stage 3D Classification**: Classifies items into `active`, `prev`, `next`, `far-prev`, `far-next`, and `hidden` for seamless entrance and exit without pop-in.
- **Navigation**: Next/Prev SVG arrow buttons, keyboard arrows, touch swipe, direct card click, and 10 interactive pagination dots.

### 3. `ScrollCarousel.tsx`
- Displays ancient parchment scrolls for festival events in 3D Coverflow layout.
- Features identical multi-stage smooth gliding, touch swipe, keyboard controls, and pagination indicators.

### 4. `ChakraMedallion.tsx`
- Wraps `<model-viewer>` for the 3D rotating wheel.
- **On-Demand Script Loading**: Dynamically injects `model-viewer.min.js` only when this component is mounted, ensuring subpages (`/team`, `/events`, `/sponsors`, `/calendar`) do not download the 300KB 3D bundle.

### 5. `ParticleCanvas.tsx`
- Canvas-based particle emitter simulating gold and amber embers with randomized flicker speed, opacity drift, and screen-edge wrapping.

### 6. `SubpageLayout.tsx`
- Reusable layout component providing the fixed topbar (brand logo + NavIslands), background parallax layers (space canvas + cosmic particles + temple pillars), and optional header.

---

## 7. Design System & CSS 3D Coverflow Mechanics

Defined in [`app/globals.css`](file:///c:/Users/haric/Desktop/ActualArtimas26/app/globals.css):

### Color Tokens:
- **Background**: `#0a0507` (Deep Cosmic Obsidian)
- **Primary Gold**: `#d4883a`
- **Glow Gold**: `#fef08a` / `#f59e0b`
- **Parchment Text**: `#f3e8dd` / `#e8c396`

### 3D Stage Math:
```css
.scroll-card.active   { transform: translate(-50%, -50%) scale(1) translateZ(0); opacity: 1; }
.scroll-card.prev     { transform: translate(-50%, -50%) translateX(calc(-50% - min(16vw, 240px))) scale(0.76) rotateY(16deg) translateZ(-40px); opacity: 0.42; }
.scroll-card.next     { transform: translate(-50%, -50%) translateX(calc(50% + min(16vw, 240px))) scale(0.76) rotateY(-16deg) translateZ(-40px); opacity: 0.42; }
.scroll-card.far-prev { transform: translate(-50%, -50%) translateX(calc(-50% - min(30vw, 420px))) scale(0.58) rotateY(24deg) translateZ(-100px); opacity: 0; }
.scroll-card.far-next { transform: translate(-50%, -50%) translateX(calc(50% + min(30vw, 420px))) scale(0.58) rotateY(-24deg) translateZ(-100px); opacity: 0; }
```
- Uses `cubic-bezier(0.25, 1, 0.4, 1)` easing over `0.85s` with `backface-visibility: hidden` and `transform-style: preserve-3d` for hardware-accelerated 60fps performance.

---

## 8. Development & Build Commands

```bash
# Start local development server with Turbopack (Port 3000)
npm run dev

# Build production bundle with Next.js static generation
npm run build

# Start production server
npm start

# Run TypeScript type validation
npx tsc --noEmit
```

---

## 9. Key Conventions & Maintenance Notes

1. **Adding New Media**: Always add media through [`lib/media.ts`](file:///c:/Users/haric/Desktop/ActualArtimas26/lib/media.ts) using Cloudinary transformations (`f_auto,q_auto,w_...,c_limit`) rather than referencing raw URLs in components.
2. **Subpage Navigation**: Use `<Link prefetch={true}>` in [`components/NavIslands.tsx`](file:///c:/Users/haric/Desktop/ActualArtimas26/components/NavIslands.tsx) to maintain instant route switching.
3. **Carousel Items**: When adjusting card counts in `TeamCarousel` or `ScrollCarousel`, update both `TOTAL_TEAM_MEMBERS` / `TOTAL_SCROLLS` and the circular offset modulo calculation.
