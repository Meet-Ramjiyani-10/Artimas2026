/**
 * Cloudinary Media CDN Assets with Automated Format & Quality Optimization
 *
 * `f_auto` automatically converts images to WebP/AVIF and videos to optimal codecs (H.264/VP9/AV1).
 * `q_auto` automatically tunes compression for lightning-fast delivery without visual loss.
 */
export const MEDIA = {
  videos: {
    intro: '/videos/intro.webm',
    introMobile: '/videos/intro-mobile.webm',
    satyug: '/videos/satyug.mp4',
    treta: '/videos/treta.mp4',
    dwapar: '/videos/dwapar.mp4',
    kalyug: '/videos/kalyug.mp4',
  },
  models: {
    chakraMedallion: '/models/chakra_medallion.glb',
  },
  images: {
    logo: 'https://res.cloudinary.com/qllarlul/image/upload/v1788690181/Logo_with_footer.webp',
    paymentQr: 'https://res.cloudinary.com/qllarlul/image/upload/v1788692475/QR.jpg',
    aimsaLogo: 'https://res.cloudinary.com/qllarlul/image/upload/e_trim/f_auto,q_auto,w_240,c_limit/v1788372702/xijdufnorzgujqejjosp.png',
    kalchakra: '/images/kalchakra.webp',
    bgImage: 'https://res.cloudinary.com/qllarlul/image/upload/v1788219483/bg_image.png',
    pillar: '/images/layer_1_pillar.png',
    pillarMobile: '/images/layer_1_pillar_mobile.webp',
    scroll: 'https://res.cloudinary.com/qllarlul/image/upload/f_auto,q_auto,w_950,c_limit/v1788219523/scroll_without_background.png',
    eventCard: '/images/event-card.webp',
    teamCard: 'https://res.cloudinary.com/qllarlul/image/upload/f_auto,q_auto,w_950,c_limit/v1788221666/Untitled_-_01_September_2026_at_05.43.34.png',
    datathonFish: '/images/datathon-fish.webp',
    promptRelayLotus: '/images/prompt-relay-lotus.png',
    brandathonRath: '/images/brandathon-rath.webp',
    hackmatrixArt: '/images/hackmatrix-art.webp',
    ctfFeather: '/images/ctf-feather.webp',
    amongUsArt: '/images/among-us-art.webp',
    pixelPerfectTurtle: '/images/pixel-perfect-turtle.webp',
    houdiniHeistArt: '/images/houdini-heist-art.webp',
    chakraRotateBtn: 'https://res.cloudinary.com/qllarlul/image/upload/f_auto,q_auto/v1788353112/Untitled_-_September_02_2026_at_18.13.57.webp',
    calendarPages: {
      page1: 'https://res.cloudinary.com/qllarlul/image/upload/v1788619378/1.webp?v=1',
      page2: 'https://res.cloudinary.com/qllarlul/image/upload/v1788619378/2.webp?v=1',
      page3: 'https://res.cloudinary.com/qllarlul/image/upload/v1788619378/3.webp?v=1',
      page4: 'https://res.cloudinary.com/qllarlul/image/upload/v1788619378/4.webp?v=1',
    },
    footerLogos: {
      aimsa: 'https://res.cloudinary.com/qllarlul/image/upload/v1788372702/xijdufnorzgujqejjosp.webp',
      gfg: 'https://res.cloudinary.com/qllarlul/image/upload/v1788372702/d5eqjmrvn4lsuztjqwwg.webp',
      inns: 'https://res.cloudinary.com/qllarlul/image/upload/v1788372702/g49q57qhpnovu6btzgem.webp',
      aaai: 'https://res.cloudinary.com/qllarlul/image/upload/v1788372802/AAAI.webp',
      ieeeCs: '/images/footer/ieee_cs.webp',
      ieeeCis: '/images/footer/ieee_cis_max.webp',
    },
    yugaTitles: {
      0: 'https://res.cloudinary.com/qllarlul/image/upload/f_auto,q_auto,w_800,c_limit/v1788219529/Satya_Yuga.png',
      90: 'https://res.cloudinary.com/qllarlul/image/upload/f_auto,q_auto,w_800,c_limit/v1788219525/Treta_Yuga.png',
      180: 'https://res.cloudinary.com/qllarlul/image/upload/f_auto,q_auto,w_800,c_limit/v1788219523/Dwapara_Yuga.png',
      270: 'https://res.cloudinary.com/qllarlul/image/upload/f_auto,q_auto,w_800,c_limit/v1788219528/Kali_Yuga.png',
    },
    sponsors: {
      munching: {
        smokedTaxi: 'https://res.cloudinary.com/qllarlul/image/upload/v1788713313/smoked_taxi.webp',
        froyoLand: 'https://res.cloudinary.com/qllarlul/image/upload/v1788713313/froyo_land.webp',
        balaji: 'https://res.cloudinary.com/qllarlul/image/upload/v1788713313/balaji.webp',
        budhani: 'https://res.cloudinary.com/qllarlul/image/upload/v1788713313/budhani.webp',
      },
    },
  },
} as const;
