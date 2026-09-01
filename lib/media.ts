/**
 * Cloudinary Media CDN Assets with Automated Format & Quality Optimization
 *
 * `f_auto` automatically converts images to WebP/AVIF and videos to optimal codecs (H.264/VP9/AV1).
 * `q_auto` automatically tunes compression for lightning-fast delivery without visual loss.
 */
export const MEDIA = {
  videos: {
    intro: 'https://res.cloudinary.com/qllarlul/video/upload/v1788276601/I_WANT_THIS_EXACT_SAME_VIDEO_no_watermark.mp4',
    satyug: 'https://res.cloudinary.com/qllarlul/video/upload/f_auto,q_auto/v1788258448/SatyaYuga_EnhancedR.mp4',
    treta: 'https://res.cloudinary.com/qllarlul/video/upload/f_auto,q_auto/v1788219875/Tretayug_enhanced.mp4',
    dwapar: 'https://res.cloudinary.com/qllarlul/video/upload/f_auto,q_auto/v1788258632/DwaparaYugaEnhancedR.mp4',
    kalyug: 'https://res.cloudinary.com/qllarlul/video/upload/f_auto,q_auto/v1788219744/Kalyug.mp4',
  },
  models: {
    chakraMedallion: 'https://res.cloudinary.com/qllarlul/image/upload/v1788219745/chakra_medallion.glb',
  },
  images: {
    logo: 'https://res.cloudinary.com/qllarlul/image/upload/f_auto,q_auto,w_500,c_limit/v1788219523/logo.png',
    bgImage: 'https://res.cloudinary.com/qllarlul/image/upload/f_auto,q_auto,w_1920,c_limit/v1788219483/bg_image.png',
    pillar: 'https://res.cloudinary.com/qllarlul/image/upload/v1788219529/layer_1_pillar.png',
    scroll: 'https://res.cloudinary.com/qllarlul/image/upload/f_auto,q_auto,w_950,c_limit/v1788219523/scroll_without_background.png',
    eventCard: 'https://res.cloudinary.com/qllarlul/image/upload/v1788273328/event-card.webp',
    teamCard: 'https://res.cloudinary.com/qllarlul/image/upload/f_auto,q_auto,w_950,c_limit/v1788221666/Untitled_-_01_September_2026_at_05.43.34.png',
    yugaTitles: {
      0: 'https://res.cloudinary.com/qllarlul/image/upload/f_auto,q_auto,w_800,c_limit/v1788219529/Satya_Yuga.png',
      90: 'https://res.cloudinary.com/qllarlul/image/upload/f_auto,q_auto,w_800,c_limit/v1788219525/Treta_Yuga.png',
      180: 'https://res.cloudinary.com/qllarlul/image/upload/f_auto,q_auto,w_800,c_limit/v1788219523/Dwapara_Yuga.png',
      270: 'https://res.cloudinary.com/qllarlul/image/upload/f_auto,q_auto,w_800,c_limit/v1788219528/Kali_Yuga.png',
    },
  },
} as const;
