export interface ContactPerson {
  name: string;
  phone: string;
  role?: string;
}

export interface EventContactGroup {
  eventSlug: string;
  eventName: string;
  heads: ContactPerson[];
}

export const EVENT_CONTACTS: Record<string, EventContactGroup> = {
  'datathon': {
    eventSlug: 'datathon',
    eventName: 'Datathon',
    heads: [
      { name: 'Shamal', phone: '9511746783', role: 'Event Head' },
      { name: 'Meet', phone: '7588235428', role: 'Event Head' },
      { name: 'Rutuja', phone: '8261977022', role: 'Event Head' },
      { name: 'Ansh', phone: '8408905979', role: 'Event Head' },
    ],
  },
  'prompt-relay': {
    eventSlug: 'prompt-relay',
    eventName: 'Prompt Relay',
    heads: [
      { name: 'Muskan', phone: '9266860617', role: 'Event Head' },
      { name: 'Shruti', phone: '8010352757', role: 'Event Head' },
      { name: 'Anuska', phone: '8104595396', role: 'Event Head' },
    ],
  },
  'houdini-heist': {
    eventSlug: 'houdini-heist',
    eventName: 'Houdini Heist',
    heads: [
      { name: 'Parth', phone: '8788423371', role: 'Event Head' },
      { name: 'Sanika', phone: '8605768657', role: 'Event Head' },
      { name: 'Ved', phone: '8626049559', role: 'Event Head' },
      { name: 'Bhumika', phone: '8766642327', role: 'Event Head' },
    ],
  },
  'among-us': {
    eventSlug: 'among-us',
    eventName: 'Among Us',
    heads: [
      { name: 'Soham', phone: '7972818734', role: 'Event Head' },
      { name: 'Sarfaraz', phone: '9359800047', role: 'Event Head' },
      { name: 'Pratham', phone: '8263967306', role: 'Event Head' },
      { name: 'Jatin', phone: '7841969111', role: 'Event Head' },
    ],
  },
  'capture-the-flag': {
    eventSlug: 'capture-the-flag',
    eventName: 'Capture the Flag',
    heads: [
      { name: 'Chirag', phone: '8767386340', role: 'Event Head' },
      { name: 'Kshitij', phone: '93322642174', role: 'Event Head' },
      { name: 'Vrushabh', phone: '7499340612', role: 'Event Head' },
    ],
  },
  'brandathon': {
    eventSlug: 'brandathon',
    eventName: 'Brandathon',
    heads: [
      { name: 'Debottam', phone: '8698651336', role: 'Event Head' },
      { name: 'Aarya', phone: '7743850757', role: 'Event Head' },
      { name: 'Tanmayee', phone: '9075859781', role: 'Event Head' },
      { name: 'Sharvari', phone: '8459068976', role: 'Event Head' },
      { name: 'Prince', phone: '8459633120', role: 'Event Head' },
    ],
  },
  'pixel-perfect': {
    eventSlug: 'pixel-perfect',
    eventName: 'Surprise Event',
    heads: [
      { name: 'Hari', phone: '9404260399', role: 'Event Head' },
      { name: 'Nirbhay', phone: '8668954048', role: 'Event Head' },
      { name: 'Krish', phone: '9922499717', role: 'Event Head' },
    ],
  },
};

const ALIAS_TO_SLUG: Record<string, string> = {
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
  'amongus': 'among-us',
};

export function getEventContacts(slug: string): EventContactGroup {
  const normalized = (slug || '').toLowerCase().trim();
  if (EVENT_CONTACTS[normalized]) {
    return EVENT_CONTACTS[normalized];
  }
  const canonical = ALIAS_TO_SLUG[normalized];
  if (canonical && EVENT_CONTACTS[canonical]) {
    return EVENT_CONTACTS[canonical];
  }
  return EVENT_CONTACTS['datathon'];
}

export function getAllEventContacts(): EventContactGroup[] {
  return [
    EVENT_CONTACTS['datathon'],
    EVENT_CONTACTS['prompt-relay'],
    EVENT_CONTACTS['houdini-heist'],
    EVENT_CONTACTS['among-us'],
    EVENT_CONTACTS['capture-the-flag'],
    EVENT_CONTACTS['brandathon'],
    EVENT_CONTACTS['pixel-perfect'],
  ];
}
