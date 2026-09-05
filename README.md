<div align="center">

# ❖ ARTIMAS 2026 ❖
### The Cosmic Epochs of Innovation & Technology

[![Next.js](https://img.shields.io/badge/Next.js-16.3.4-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Turbopack](https://img.shields.io/badge/Turbopack-Enabled-0284C7?style=for-the-badge&logo=turbopack&logoColor=white)](https://turbo.build/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-Media_CDN-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)](https://cloudinary.com/)

<p align="center">
  <b>Department of Computer Science & Engineering (AI & ML)</b><br>
  <i>Pimpri Chinchwad College of Engineering (PCCOE), Pune</i><br>
  In Association with <b>AIMSA</b>
</p>

---

</div>

## 🌌 Overview

**Artimas 2026** is a next-generation, high-performance web experience that weaves ancient Indian cosmic cosmology—**The Four Yugas**—with modern 3D graphics, multi-layer depth parallax, cinematic background video engines, and hardware-accelerated 3D Coverflow carousels.

It serves as the grand interactive portal, chronicles showcase, and event registration hub for the **Artimas 2026** national festival.

---

## ✨ Key Features & Highlights

- **🎬 Fullscreen Cinematic Intro**: Dynamic 4K introductory cinematic on first visit with instant audio toggle and skip controls.
- **☸️ 3D Chakra Medallion (Wheel of Time)**: Interactive 3D WebGL PBR model rendered via `@google/model-viewer` with on-demand lazy script loading.
- **⏳ The Four Cosmic Epochs (The Yugas)**:
  - **Satya Yuga** (0°): The Golden Age of Truth & Sages
  - **Treta Yuga** (+90°): The Silver Age of Valor & Surya
  - **Dwapara Yuga** (+180°): The Bronze Age of Strategy & Duels
  - **Kali Yuga** (+270°): The Iron Age of Entropy & Kalki
- **🎚️ Astrolabe Linear Epoch Slider**: Vertical right-docked slider with smooth scroll interpolation, step pips, Roman numerals, and Devanagari labels.
- **📜 3D Coverflow Carousel Stages**:
  - Fluid 60fps 3D carousel systems for **Events** (`/events`), **Team** (`/team`), and **Sponsors** (`/sponsors`).
  - Custom mythic centerpieces for each event (e.g. Datathon Fish, Prompt Relay Lotus, Brandathon Turtle, HackMatrix Crest, CTF Feather, Among Us Cosmic Blade, Surprise Rath, Houdini Gada).
- **📝 Multi-Step Registration Wizard**:
  - In-app dynamic team form with validation for solo and squad trials.
  - Collapsible UPI QR payment verification with screenshot upload.
  - Unique Pass ID generation (`ART26-[SLUG]-[ID]`).
- **📅 Chronicles of Time (`/calendar`)**: Day-by-day milestone timeline covering schedules across both festival days.
- **🏝️ Dual-Mode Navigation Islands**: Floating frosted-glass navigation bar on desktop and an animated mobile capsule drawer on smartphones.

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
|---|---|---|
| **Framework** | **Next.js 16** (App Router) | Server-side rendering, static generation, route prefetching, and Turbopack |
| **UI Library** | **React 19** | Concurrent rendering, state hooks, and dynamic imports |
| **Language** | **TypeScript 5.8+** | Strict type safety, typed model-viewer intrinsic elements, typed event schemas |
| **Styling** | **Custom Vanilla CSS** | 4,800+ lines of custom CSS, 3D transform matrices, glassmorphism, fluid clamp typography |
| **3D Rendering** | **@google/model-viewer 3.5.0** | Web component rendering `chakra_medallion.glb` with WebGL/PBR lighting |
| **Particle Physics** | **HTML5 2D Canvas** | 60fps golden ember particle simulation with sinusoidal flicker algorithms |
| **Media Delivery** | **Cloudinary CDN** | Edge-cached video delivery and automated format/size optimizations (`f_auto,q_auto,w_...`) |
| **Typography** | **Google Fonts** | *Cinzel Decorative* (Headings) and *Cormorant Garamond* (Body & Decrees) |

---

## 📁 Repository Structure

```text
Artimas2026/
├── app/
│   ├── calendar/
│   │   └── page.tsx              # Festival schedule & milestone timeline
│   ├── events/
│   │   ├── [slug]/
│   │   │   ├── register/
│   │   │   │   └── page.tsx      # Multi-step registration wizard
│   │   │   ├── rulebook/
│   │   │   │   └── page.tsx      # Official rules & guidelines decree
│   │   │   └── page.tsx          # Dynamic slug redirect handler
│   │   └── page.tsx              # 3D Coverflow events showcase
│   ├── sponsors/
│   │   └── page.tsx              # 3D Coverflow sponsors showcase
│   ├── team/
│   │   └── page.tsx              # 3D Coverflow council & leads carousel
│   ├── globals.css               # Core styling tokens, 3D math & responsive design
│   ├── layout.tsx                # Root layout, Google Fonts, global metadata
│   ├── not-found.tsx             # Custom cosmic 404 chamber
│   └── page.tsx                  # Home route — renders <ArtimasScene />
├── components/
│   ├── ArtimasScene.tsx          # Landing state coordinator & Yugas transition engine
│   ├── ChakraMedallion.tsx       # <model-viewer> 3D component with lazy script loading
│   ├── EventRegistrationWizard.tsx # Multi-step registration wizard & pass generator
│   ├── IntroVideoOverlay.tsx     # Fullscreen cinematic intro video with sound toggle
│   ├── LandingFooter.tsx         # Natural flow footer with association & department info
│   ├── LinearEventsSlider.tsx    # Linear events pagination slider
│   ├── LinearYugaSlider.tsx      # Vertical linear slider for Yuga switching
│   ├── MythicCrestIcon.tsx       # SVG mythic crests (Lotus, Solar, Chakra, Blade)
│   ├── NavIslands.tsx            # Desktop navbar & mobile capsule pill drawer
│   ├── PageTransitionLoader.tsx  # Cinematic astrolabe Sanskrit page transition loader
│   ├── ScrollCarousel.tsx        # 3D Coverflow events carousel
│   ├── SponsorsGrid.tsx          # Sponsors decree grid showcase
│   ├── SubpageLayout.tsx         # Subpage layout wrapper (topbar, background, footer)
│   └── TeamGrid.tsx              # Team council decree grid showcase
├── lib/
│   ├── events.ts                 # Central event catalog, team configs, fees, Sanskrit mantras
│   ├── introState.ts             # In-memory runtime state tracking for intro video
│   └── media.ts                  # Cloudinary media registry with optimization flags
├── public/                       # Fallback artwork, 3D GLB model, and local media assets
├── types/
│   └── model-viewer.d.ts         # JSX intrinsic element declarations for <model-viewer>
├── context.md                    # Deep architectural & technical documentation
└── README.md                     # Project overview and developer quickstart
```

---

## 🏆 Festival Chronicles & Events

| Event | Category | Epoch | Entry Fee | Team Size | Prize Pool |
|---|---|---|---|---|---|
| **Datathon** | Data Science & AI | Satya Yuga | ₹150 | 1 - 2 | ₹30,000 |
| **Surprise Event** | Competitive Photography | Satya Yuga | ₹100 | 1 (Solo) | Exciting Rewards |
| **Prompt Relay** | Generative AI Sprint | Treta Yuga | ₹150 | 1 - 3 | ₹20,000 |
| **Brandathon** | Design & Strategy | Treta Yuga | ₹150 | 2 - 4 | ₹25,000 |
| **Capture the Flag** | Cybersecurity & War Games | Dwapara Yuga | ₹150 | 1 - 3 | ₹25,000 |
| **Houdini Heist** | Mystery & Escape Quest | Dwapara Yuga | ₹150 | Exactly 3 | ₹20,000 |
| **Among Us** | Gaming & Social Deduction | Kali Yuga | ₹50 | 1 (Solo) | ₹10,000 |
| **HackMatrix** | 24h Hackathon & Engineering | Kali Yuga | ₹150 | 2 - 4 | ₹30,000 |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18.18 or higher recommended)
- `npm` or `pnpm` / `yarn`

### Installation & Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Meet-Ramjiyani-10/Artimas2026.git
   cd Artimas2026
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server (with Turbopack)**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Type Checking & Verification**:
   ```bash
   npx tsc --noEmit
   ```

5. **Build for Production**:
   ```bash
   npm run build
   npm start
   ```

---

## 🏛️ Department & Association Credits

- **Organized By**: Department of Computer Science & Engineering (AI & ML)
- **Institution**: Pimpri Chinchwad College of Engineering (PCCOE), Sector 26, Pradhikaran, Nigdi, Pune - 411044
- **Student Association**: AIMSA (*All India AI & ML Students Association*)
- **Motto**: *|| एम्सा कुटुम्बकम् ||*

---

<div align="center">
  <sub>Crafted with ❤️ by the <b>ARTIMAS Tech Team</b> • © 2026 ARTIMAS. All Rights Reserved.</sub>
</div>
