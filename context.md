# Artimas 2026 — Project Context & Architectural Documentation

> **Artimas 2026** is an immersive, state-of-the-art web experience blending ancient Indian cosmic mythology with modern 3D graphics, parallax depth rendering, cinematic video transitions, and interactive 3D Coverflow carousels. It serves as the grand digital portal and registration platform for the Artimas 2026 technical and cultural festival organized by the Department of Computer Science & Engineering (AI & ML) at Pimpri Chinchwad College of Engineering (PCCOE), Pune, in association with AIMSA.

---

## 1. Project Overview & Vision

Artimas transports festival attendees through the **Four Cosmic Epochs (The Yugas)**—Satya, Treta, Dwapara, and Kali Yuga. The experience features an interactive 3D Chakra Medallion (The Wheel of Time), ambient 2D canvas particle physics, multi-layer depth parallax, cinematic background video engines, and custom-styled 3D Coverflow showcases for events, team leads, and sponsors.

### Core Experience Highlights:
- **Cinematic Intro Video (`IntroVideoOverlay`)**: Fullscreen 4K introductory cinematic on initial visit with mute/unmute and skip controls, seamlessly handing off to the 3D scene.
- **Landing Horizon & Wheel Emergence**: Mythic temple pillars, celestial cosmic background, descending glowing brand emblem, and the emerging 3D Chakra Medallion.
- **The Yugas Dimension (`mode-yugas`)**: The 3D Wheel descends into the cosmic horizon, transitioning between living video landscapes corresponding to each mythological epoch.
- **Linear Epoch Slider (`LinearYugaSlider`)**: A sleek, vertical astrolabe slider allowing fluid navigation across the 4 epochs with step pips, Roman numerals, and Devanagari labels.
- **Navigation Islands (`NavIslands`)**: Dual-mode navigation featuring a desktop glass navbar and a mobile capsule pill drawer with smooth backdrop animations.
- **Interactive Event Decrees & 3D Coverflow**: Ancient parchment decree cards with custom mythological centerpieces (e.g., Datathon Matsya Fish, Prompt Relay Lotus, Brandathon Kurma Turtle, HackMatrix Crest, CTF Peacock Feather, Among Us Cosmic Bow, Surprise Event Rath, Houdini Heist Gada).
- **Multi-Step Event Registration Wizard (`EventRegistrationWizard`)**: In-app registration wizard handling team formation, dynamic participant validation, fee calculations, UPI QR codes, screenshot uploads, and pass ID generation.
- **Chronicles of Time (`/calendar`)**: A day-by-day milestone timeline detailing schedules across both festival days.
- **Landing Footer (`LandingFooter`)**: Department and association branding (AIMSA, Campus Buzz, AAAI, CIS IEEE), social links, and university attribution.

---

## 2. Technology Stack

| Domain | Technology / Library | Role & Details |
|---|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) | Server-side rendering, static generation, route prefetching, and Turbopack dev tooling (`--turbopack`) |
| **UI Runtime** | [React 19](https://react.dev/) | Modern concurrent React, hooks (`useCallback`, `useEffect`, `useRef`, `useState`, `useId`), dynamic imports (`next/dynamic`) |
| **Language** | [TypeScript 5.8+](https://www.typescriptlang.org/) | Strict type safety, custom JSX declarations for `<model-viewer>`, typed event and media schemas |
| **Styling** | Custom Vanilla CSS (`globals.css`) | 4,800+ lines of custom CSS, CSS 3D hardware-accelerated transforms (`perspective`, `rotateY`, `translateZ`), glassmorphic design, fluid clamp typography |
| **3D Rendering** | [@google/model-viewer](https://modelviewer.dev/) 3.5.0 | Web component rendering `chakra_medallion.glb` with WebGL/PBR lighting and lazy dynamic script injection |
| **Particle Physics** | HTML5 2D Canvas API | 60fps golden ember particle simulation with dynamic drift, size variance, and sinusoidal flicker algorithms |
| **Media CDN** | [Cloudinary](https://cloudinary.com/) | Edge-cached video delivery and on-the-fly transformations (`f_auto,q_auto,w_...,c_limit,e_trim`) |
| **Typography** | Google Fonts (`next/font/google`) | *Cinzel Decorative* (`--font-title`) for mythic titles and *Cormorant Garamond* (`--font-body`) for parchment typography |

---

## 3. Complete Directory Structure

```text
Artimas2026/
├── app/
│   ├── calendar/
│   │   └── page.tsx              # Day-by-day festival schedule & milestones
│   ├── events/
│   │   ├── [slug]/
│   │   │   ├── register/
│   │   │   │   └── page.tsx      # Event registration wizard route
│   │   │   ├── rulebook/
│   │   │   │   └── page.tsx      # Official rules & guidelines decree route
│   │   │   └── page.tsx          # Dynamic slug redirect handler
│   │   └── page.tsx              # 3D Coverflow scroll carousel of festival events
│   ├── sponsors/
│   │   └── page.tsx              # 3D Coverflow showcase of patrons & partners
│   ├── team/
│   │   └── page.tsx              # 3D Coverflow council & leads carousel
│   ├── globals.css               # Design tokens, 3D stage math, decree cards, responsive layout
│   ├── layout.tsx                # Root layout, Google Fonts (Cinzel Decorative, Cormorant Garamond), metadata
│   ├── not-found.tsx             # Custom 404 cosmic epoch not found page
│   └── page.tsx                  # Home route — renders <ArtimasScene />
├── components/
│   ├── ArtimasScene.tsx          # Main landing state coordinator, Yugas mode engine, video cross-fader
│   ├── ChakraMedallion.tsx       # <model-viewer> 3D component with lazy script injection
│   ├── CircularYugaDial.tsx      # Astrolabe circular dial navigation alternative
│   ├── EventRegistrationWizard.tsx # Multi-step interactive registration wizard & pass generator
│   ├── IntroVideoOverlay.tsx     # Fullscreen cinematic intro video with sound toggle & skip
│   ├── LandingFooter.tsx         # Natural flow footer with association & department info
│   ├── LinearYugaSlider.tsx      # Vertical linear slider for Yuga switching
│   ├── MythicCrestIcon.tsx       # SVG mythic crests (Lotus, Solar, Chakra, Blade)
│   ├── NavIslands.tsx            # Desktop navbar & mobile capsule pill drawer
│   ├── ParticleCanvas.tsx        # 2D canvas cosmic ember emitter
│   ├── ScrollCarousel.tsx        # 3D Coverflow events carousel with custom artwork
│   ├── SponsorsCarousel.tsx      # 3D Coverflow carousel for sponsors showcase
│   ├── SubpageLayout.tsx         # Unified subpage shell (topbar, parallax background, footer)
│   └── TeamCarousel.tsx          # 3D Coverflow team carousel
├── lib/
│   ├── events.ts                 # Central event catalog, team configs, fees, Sanskrit mantras
│   ├── introState.ts             # In-memory runtime state tracking for intro video
│   └── media.ts                  # Cloudinary media registry with automated format & dimension params
├── public/
│   ├── assets/                   # Local fallback artwork, 3D GLB model, textures, pillars
│   ├── images/                   # Local event illustrations (lotus, turtle, feather, fish)
│   └── videos/                   # Local fallback Yuga background video clips
├── types/
│   └── model-viewer.d.ts         # JSX intrinsic element type definitions for <model-viewer>
├── next.config.ts                # Next.js configuration (unoptimized images for CDN, tracing root)
├── package.json                  # Dependencies, scripts (dev with Turbopack, build, start)
├── tsconfig.json                 # Strict TypeScript configuration and module resolution
├── context.md                    # Detailed architectural and developer context (this document)
└── README.md                     # Public repository overview and quickstart guide
```

---

## 4. Cosmic Epochs (The Four Yugas)

The universe of Artimas revolves around four cosmic epochs. In `mode-yugas`, rotating the Chakra Medallion or navigating via the `LinearYugaSlider` updates the active epoch, fading in the corresponding high-definition living background video and filtering the event decrees:

| Epoch | Angle | Normalized Angle | Video Asset | Mythic Crest | Sanskrit Mantra | Dharma Level | Associated Events |
|---|---|---|---|---|---|---|---|
| **Satya Yuga** | `0°` / `720°+` | `0°` | `SatyaYuga_EnhancedR.mp4` | Lotus (`𑁍`) | ॥ सत्यं ज्ञानमनन्तं ब्रह्म ॥ | `4/4` | Datathon, Pixel Perfect |
| **Treta Yuga** | `+90°` | `90°` | `Tretayug_enhanced.mp4` | Solar (`☼`) | ॥ पराक्रमेण लभ्यते विजयः ॥ | `3/4` | Prompt Relay, Brandathon |
| **Dwapara Yuga** | `+180°` | `180°` | `DwaparaYugaEnhancedR.mp4` | Chakra (`☸`) | ॥ व्यूहरचना भेदनम् ॥ | `2/4` | Capture the Flag, Houdini Heist |
| **Kali Yuga** | `+270°` | `270°` | `Kalyug_EnhancedR.mp4` | Blade (`⚡`) | ॥ अन्तिम रणक्षेत्रम् ॥ | `1/4` | Among Us, HackMatrix |

---

## 5. Media & CDN Architecture (`lib/media.ts`)

All high-bandwidth media assets are hosted on Cloudinary (`res.cloudinary.com/qllarlul/`) and centrally configured in [`lib/media.ts`](file:///c:/Users/haric/Desktop/Artimas2026/lib/media.ts).

### Automated CDN Transformations:
- `f_auto`: Automatically negotiates optimal formats (WebP/AVIF for images, H.264/VP9/AV1 for videos) based on browser capability.
- `q_auto`: Dynamic perceptual compression tuning for ultra-fast initial loads without perceptual degradation.
- `w_...,c_limit`: Strict bounding box constraints (e.g., `w_950` for carousel cards, `w_1920` for 4K video backgrounds, `w_500` for logos).
- `e_trim`: Automatically trims transparent borders around custom illustration PNGs/WebPs.

### Asset Map Summary:
```typescript
export const MEDIA = {
  videos: {
    intro:   '.../Video_Project_5.webm',
    satyug:  '.../f_auto,q_auto/.../SatyaYuga_EnhancedR.mp4',
    treta:   '.../f_auto,q_auto/.../Tretayug_enhanced.mp4',
    dwapar:  '.../f_auto,q_auto/.../DwaparaYugaEnhancedR.mp4',
    kalyug:  '.../f_auto,q_auto/.../Kalyug_EnhancedR.mp4',
  },
  models: {
    chakraMedallion: '.../chakra_medallion.glb',
  },
  images: {
    logo:             '.../f_auto,q_auto,w_800,c_limit/.../artimas_logo.webp',
    bgImage:          '.../f_auto,q_auto,w_1920,c_limit/.../bg_image.png',
    pillar:           '.../layer_1_pillar.png',
    eventCard:        '.../e_trim/f_auto,q_auto,w_950,c_limit/.../event-card.webp',
    datathonFish:     '.../e_trim/f_auto,q_auto/.../matsya_fish.webp',
    promptRelayLotus:   '/images/prompt-relay-lotus.png',
    brandathonRath:     '.../e_trim/f_auto,q_auto/.../rath-clean2.webp',
    hackmatrixArt:      '.../e_trim/f_auto,q_auto/.../hackmatrix_crest.webp',
    ctfFeather:         '.../e_trim/f_auto,q_auto/.../peacock_feather.webp',
    amongUsArt:         '.../e_trim/f_auto,q_auto/.../cosmic_blade.webp',
    surpriseEventTurtle:'.../e_trim/f_auto,q_auto/.../kurma_turtle.webp',
    houdiniHeistArt:    '.../e_trim/f_auto,q_auto/.../gada_mace.webp',
    yugaTitles: {
      0:   '.../Satya_Yuga.png',
      90:  '.../Treta_Yuga.png',
      180: '.../Dwapara_Yuga.png',
      270: '.../Kali_Yuga.png',
    },
  },
};
```

---

## 6. Detailed Component Breakdown

### 1. `ArtimasScene.tsx` (Core Landing Page Controller)
- **Viewport Modes**: Coordinates switching between **Landing Hero Mode** and **Yugas Mode** (`mode-yugas`).
- **Wheel Dynamics**: Manages the CSS rotation matrix of the 3D Chakra Medallion, snapping to 90° increments with multi-revolution accumulation (e.g. 720° entry transition).
- **Multi-Input Controls**: Mouse wheel scrolling, vertical swipe touch gestures, keyboard arrows (`←`/`→`/`↑`/`↓`), and numeric keys (`1`, `2`, `3`, `4`).
- **Video Cross-Fade Engine**: Tracks video references with buffered `play()`/`pause()` timeouts to prevent browser media pipeline lockups.
- **Yuga Decree Showcase**: In Yugas mode, renders the two active epoch events with a grand bottom-of-the-page rising animation (`yugaCardRiseLeft` & `yugaCardRiseRight` with 3D perspective settling on desktop, and `yugaShowcaseRiseMobile` on mobile).

### 2. `LinearYugaSlider.tsx` (Vertical Astrolabe Slider)
- Right-docked navigation bar visible during Yugas mode.
- Features vertical progress fill, a sliding gold carriage thumb (`✦`), and 4 epoch nodes displaying Roman numerals, English names, and Devanagari script.
- Supports direct click selection, step arrow navigation, and track mouse wheel scrolling.

### 3. `ChakraMedallion.tsx` (3D Web Component Wrapper)
- Renders `<model-viewer>` hosting `chakra_medallion.glb`.
- **On-Demand Script Loading**: Injects `model-viewer.min.js` asynchronously when mounted, preventing subpages from loading unnecessary 3D libraries.
- Camera orbit is locked to `0deg 90deg 110%` with zero shadow overhead for maximum frame rates.

### 4. `ScrollCarousel.tsx` (3D Coverflow Events Showcase)
- Implements hardware-accelerated 3D Coverflow staging for all festival chronicles on `/events`.
- Active items are scaled to `1.0` (Z: `0px`), adjacent items are scaled to `0.76` and rotated `16deg` (Z: `-40px`), and far items are scaled to `0.58` and rotated `24deg` (Z: `-100px`).
- Includes smooth drag/swipe gesture tracking, left/right chevron navigation, pagination dots, and direct navigation buttons (`VIEW RULEBOOK` and `ENTER THE TRIAL`).

### 5. `EventRegistrationWizard.tsx` (Interactive Registration Wizard)
- Multi-step registration flow on `/events/[slug]/register`:
  1. **Step 0**: Team Name (or Participant Name for solo events).
  2. **Step 1**: Member Details (Full Name, Email, Phone, College, Year FE/SE/TE/BE, Branch, PRN/Roll No) with dynamic "+ Add Member" buttons based on `teamConfig.minMembers` and `maxMembers`.
  3. **Step 2**: Payment Verification (Collapsible UPI QR code, `artimas26@okhdfcbank` UPI ID, screenshot upload, Transaction ID/UTR input).
  4. **Success Step**: Confirmation screen with uniquely generated Pass ID (`ART26-[SLUG]-[ID]`).

### 6. `NavIslands.tsx` (Desktop Island & Mobile Capsule Pill)
- **Desktop (>768px)**: Floating frosted glass navbar with link dividers and active route indicators.
- **Mobile (≤768px)**: Compact floating capsule pill with brand logo and hamburger toggle. Toggling opens an animated drawer overlay with route navigation and body scroll locking.

### 7. `SubpageLayout.tsx` (Unified Page Shell)
- Standardized wrapper for `/events`, `/sponsors`, `/team`, `/calendar`, and `/events/[slug]/*`.
- Supplies topbar branding, parallax cosmic background, subtle pillar framing, and the `LandingFooter`.

### 8. `TeamCarousel.tsx` & `SponsorsCarousel.tsx`
- 3D Coverflow carousel components for presenting council leads and festival sponsors with circular carousel navigation.

### 9. `LandingFooter.tsx`
- Footer with student association logos (AIMSA, Campus Buzz, Student Network, AAAI Chapter, CIS IEEE, Tech Club), department branding (CSE AI & ML, PCCOE Pune), social links (LinkedIn, GitHub, Instagram, Phone, Email), and Sanskrit motto `|| एम्सा कुटुम्बकम् ||`.

### 10. `ParticleCanvas.tsx`
- 2D Canvas particle emitter simulating 80 gold/amber cosmic embers with randomized flicker speed, opacity drift, and screen wrapping.

---

## 7. Events & Chronicles Catalog (`lib/events.ts`)

| Event Slug | Name | Category | Epoch | Fee | Team Size | Prize Pool |
|---|---|---|---|---|---|---|
| `datathon` | **Datathon** | Data Science & AI | Satya Yuga | ₹150 | 1 - 2 | ₹30,000 |
| `pixel-perfect` | **Pixel Perfect** | Competitive Photography | Satya Yuga | ₹100 | 1 (Solo) | Exciting Rewards |
| `prompt-relay` | **Prompt Relay** | Generative AI Sprint | Treta Yuga | ₹150 | 1 - 3 | ₹20,000 |
| `brandathon` | **Brandathon** | Design & Strategy | Treta Yuga | ₹150 | 2 - 4 | ₹25,000 |
| `capture-the-flag` | **Capture the Flag** | Cybersecurity & War Games | Dwapara Yuga | ₹150 | 1 - 3 | ₹25,000 |
| `houdini-heist` | **Houdini Heist** | Mystery & Escape Quest | Dwapara Yuga | ₹150 | Exactly 3 | ₹20,000 |
| `among-us` | **Among Us** | Gaming & Social Deduction | Kali Yuga | ₹50 | 1 (Solo) | ₹10,000 |
| `hackmatrix` | **HackMatrix** | Hackathon & Engineering | Kali Yuga | ₹150 | 2 - 4 | ₹30,000 |

*Note: HackMatrix registration on `/events/hackmatrix/register` automatically redirects to the external hackathon portal (`https://hackmatrix.artimas.in`).*

---

## 8. Routing Hierarchy

```
/                            → Main Landing & Cosmic Yugas Horizon
├── /events                  → 3D Coverflow Events Showcase
│   ├── /events/[slug]       → Auto-redirects to /events/[slug]/register
│   ├── /events/[slug]/register → Multi-step Event Registration Wizard
│   └── /events/[slug]/rulebook → Official Guidelines & Rules Decree
├── /sponsors                → 3D Coverflow Sponsors & Patrons Showcase
├── /team                    → 3D Coverflow Council & Leads Showcase
├── /calendar                → Festival Timeline & Schedule Milestones
└── /not-found               → Custom Cosmic 404 Chamber
```

---

## 9. Design System & CSS 3D Mechanics

The design tokens and 3D stage math are declared in [`app/globals.css`](file:///c:/Users/haric/Desktop/Artimas2026/app/globals.css):

### Color Tokens:
```css
:root {
  --color-bg: #080A0C;          /* Deep Cosmic Obsidian */
  --panel-parchment: #B8945A;   /* Ancient Parchment Gold */
  --panel-highlight: #C9A45C;   /* Warm Radiant Gold */
  --border-bronze: #76552F;     /* Antique Bronze Border */
  --heading-ivory: #E8D8B0;     /* Mythic Ivory Text */
  --text-parchment: #C5B18A;    /* Parchment Body Text */
  --btn-bronze: #3A2415;        /* Deep Bronze Button Fill */
  --btn-border-gold: #A9823D;   /* Burnished Gold Button Border */
  --active-glow-gold: rgba(201, 164, 92, 0.35);
}
```

### 3D Stage Math:
```css
.scroll-card.active   { transform: translate(-50%, -50%) scale(1) translateZ(0); opacity: 1; }
.scroll-card.prev     { transform: translate(-50%, -50%) translateX(calc(-50% - min(16vw, 240px))) scale(0.76) rotateY(16deg) translateZ(-40px); opacity: 0.42; }
.scroll-card.next     { transform: translate(-50%, -50%) translateX(calc(50% + min(16vw, 240px))) scale(0.76) rotateY(-16deg) translateZ(-40px); opacity: 0.42; }
.scroll-card.far-prev { transform: translate(-50%, -50%) translateX(calc(-50% - min(30vw, 420px))) scale(0.58) rotateY(24deg) translateZ(-100px); opacity: 0; }
.scroll-card.far-next { transform: translate(-50%, -50%) translateX(calc(50% + min(30vw, 420px))) scale(0.58) rotateY(-24deg) translateZ(-100px); opacity: 0; }
```

All 3D carousel transitions use `cubic-bezier(0.25, 1, 0.4, 1)` with `backface-visibility: hidden` and `transform-style: preserve-3d` for smooth 60fps performance across devices.

---

## 10. Development & Build Commands

```bash
# Start local development server with Turbopack on port 3000
npm run dev

# Build optimized production bundle
npm run build

# Start production server
npm start

# Run TypeScript type verification
npx tsc --noEmit
```

---

## 11. Key Conventions & Maintenance Guidelines

1. **Media Additions**: Always register external media in [`lib/media.ts`](file:///c:/Users/haric/Desktop/Artimas2026/lib/media.ts) with Cloudinary optimization flags (`f_auto,q_auto,w_...,c_limit,e_trim`).
2. **Adding or Updating Events**: Add new events to `EVENTS` array in [`lib/events.ts`](file:///c:/Users/haric/Desktop/Artimas2026/lib/events.ts). Configure `teamConfig`, `fee`, `prizePool`, `mythicCrest`, and `yuga`. The Coverflow carousel and registration wizard will automatically adapt.
3. **Session Intro State**: The introductory video playback is tracked via [`lib/introState.ts`](file:///c:/Users/haric/Desktop/Artimas2026/lib/introState.ts). Navigating between SPA routes avoids replaying the intro, while refreshing the browser allows re-viewing.
4. **Performance & Typography**: Typography is loaded via `next/font/google` in [`app/layout.tsx`](file:///c:/Users/haric/Desktop/Artimas2026/app/layout.tsx) with `display: 'swap'` to eliminate layout shifts.
