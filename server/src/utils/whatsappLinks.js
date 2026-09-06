const EVENT_WHATSAPP_GROUPS = {
  'datathon': process.env.WHATSAPP_DATATHON || 'https://chat.whatsapp.com/HlP9bGbGYVuAkEPChjWwHx',
  'pixel-perfect': process.env.WHATSAPP_PIXEL_PERFECT || 'https://chat.whatsapp.com/ITNyOJQPemgAGwx4Jn2XTN',
  'prompt-relay': process.env.WHATSAPP_PROMPT_RELAY || 'https://chat.whatsapp.com/C9Nt9vvwMdpL0yrTbnH8gB',
  'brandathon': process.env.WHATSAPP_BRANDATHON || 'https://chat.whatsapp.com/IPfbUXUeiur2sq5jMhfiZ1',
  'capture-the-flag': process.env.WHATSAPP_CTF || 'https://chat.whatsapp.com/DXC58rAlLSXK7uHVBunJ6a',
  'houdini-heist': process.env.WHATSAPP_HOUDINI_HEIST || 'https://chat.whatsapp.com/BlLAG6eMzCA6SE4sCwvrgR',
  'among-us': process.env.WHATSAPP_AMONG_US || 'https://chat.whatsapp.com/J3Mv0JxW9wGKZrUWUQpVZa',
  'hackmatrix': process.env.WHATSAPP_HACKMATRIX || 'https://chat.whatsapp.com/FONJvxabDmp9NtIuI5TQOr',
};

const ALIAS_MAP = {
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

function getWhatsAppLink(slug) {
  const norm = (slug || '').toLowerCase().trim();
  if (EVENT_WHATSAPP_GROUPS[norm]) return EVENT_WHATSAPP_GROUPS[norm];
  const canonical = ALIAS_MAP[norm];
  if (canonical && EVENT_WHATSAPP_GROUPS[canonical]) return EVENT_WHATSAPP_GROUPS[canonical];
  return 'https://chat.whatsapp.com/invite/artimas2026-official';
}

module.exports = {
  EVENT_WHATSAPP_GROUPS,
  getWhatsAppLink,
};
