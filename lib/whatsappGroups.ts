export interface WhatsAppGroupInfo {
  slug: string;
  name: string;
  url: string;
}

export const EVENT_WHATSAPP_GROUPS: Record<string, WhatsAppGroupInfo> = {
  'datathon': {
    slug: 'datathon',
    name: 'Datathon | ARTIMAS 26',
    url: process.env.NEXT_PUBLIC_WHATSAPP_DATATHON || 'https://chat.whatsapp.com/datathon-artimas26',
  },
  'pixel-perfect': {
    slug: 'pixel-perfect',
    name: 'Surprise Event | ARTIMAS 26',
    url: process.env.NEXT_PUBLIC_WHATSAPP_PIXEL_PERFECT || 'https://chat.whatsapp.com/pixel-perfect-artimas26',
  },
  'prompt-relay': {
    slug: 'prompt-relay',
    name: 'Prompt Relay | ARTIMAS 26',
    url: process.env.NEXT_PUBLIC_WHATSAPP_PROMPT_RELAY || 'https://chat.whatsapp.com/prompt-relay-artimas26',
  },
  'brandathon': {
    slug: 'brandathon',
    name: 'Brandathon | ARTIMAS 26',
    url: process.env.NEXT_PUBLIC_WHATSAPP_BRANDATHON || 'https://chat.whatsapp.com/brandathon-artimas26',
  },
  'capture-the-flag': {
    slug: 'capture-the-flag',
    name: 'Capture The Flag (CTF) | ARTIMAS 26',
    url: process.env.NEXT_PUBLIC_WHATSAPP_CTF || 'https://chat.whatsapp.com/ctf-artimas26',
  },
  'houdini-heist': {
    slug: 'houdini-heist',
    name: 'Houdini Heist | ARTIMAS 26',
    url: process.env.NEXT_PUBLIC_WHATSAPP_HOUDINI_HEIST || 'https://chat.whatsapp.com/houdini-heist-artimas26',
  },
  'among-us': {
    slug: 'among-us',
    name: 'Among Us | ARTIMAS 26',
    url: process.env.NEXT_PUBLIC_WHATSAPP_AMONG_US || 'https://chat.whatsapp.com/among-us-artimas26',
  },
  'hackmatrix': {
    slug: 'hackmatrix',
    name: 'HackMatrix | ARTIMAS 26',
    url: process.env.NEXT_PUBLIC_WHATSAPP_HACKMATRIX || 'https://chat.whatsapp.com/hackmatrix-artimas26',
  },
};

const ALIAS_MAP: Record<string, string> = {
  'data-thon': 'datathon',
  'surprise-event': 'pixel-perfect',
  'surprise': 'pixel-perfect',
  'pixelperfect': 'pixel-perfect',
  'photography': 'pixel-perfect',
  'secret-event': 'pixel-perfect',
  'promptrelay': 'prompt-relay',
  'brand-a-thon': 'brandathon',
  'ctf': 'capture-the-flag',
  'houdiniheist': 'houdini-heist',
  'escape-room': 'houdini-heist',
  'escape': 'houdini-heist',
  'amongus': 'among-us',
  'imposter': 'among-us',
  'hack-matrix': 'hackmatrix',
  'hackathon': 'hackmatrix',
};

export function getEventWhatsAppGroup(slug: string, fallbackName?: string): WhatsAppGroupInfo {
  const normalized = (slug || '').toLowerCase().trim();

  if (EVENT_WHATSAPP_GROUPS[normalized]) {
    return EVENT_WHATSAPP_GROUPS[normalized];
  }

  const canonical = ALIAS_MAP[normalized];
  if (canonical && EVENT_WHATSAPP_GROUPS[canonical]) {
    return EVENT_WHATSAPP_GROUPS[canonical];
  }

  return {
    slug: normalized,
    name: fallbackName ? `${fallbackName} | ARTIMAS 26` : 'ARTIMAS 26 Official Group',
    url: 'https://chat.whatsapp.com/invite/artimas2026-official',
  };
}
