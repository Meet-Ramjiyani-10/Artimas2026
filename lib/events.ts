export interface TeamConfig {
  minMembers: number;
  maxMembers: number;
  isCompulsoryFixed?: boolean;
  memberLabelPrefix?: string;
  addMemberPrompt?: string;
}

export interface EventItem {
  id: number;
  slug: string;
  name: string;
  category: string;
  yuga: string;
  tagline: string;
  trialSubtitle: string;
  shortDescription: string;
  dateLocation: string;
  description: string;
  registerUrl: string;
  rulebookUrl: string;
  fee: number;
  ruleSubtitle: string;
  teamConfig: TeamConfig;
  sanskritMantra?: string;
  mythicCrest?: 'lotus' | 'solar' | 'chakra' | 'blade';
  dharmaLevel?: string;
  prizePool?: string;
  aliases?: string[];
}

export const EVENTS: EventItem[] = [
  // ── SATYA YUGA: THE GOLDEN AGE OF TRUTH & SAGES (3 Events) ──
  {
    id: 1,
    slug: 'hackmatrix',
    name: 'HackMatrix',
    category: 'Hackathon & Dev',
    yuga: 'Satya Yuga',
    tagline: 'The 36-Hour Mythological Coding Crucible',
    trialSubtitle: 'THE TRIAL OF INGENUITY',
    shortDescription: 'A challenge of logic, code and celestial creation.',
    dateLocation: '18 OCTOBER 2026  ·  ONLINE',
    description: 'Forge solutions spanning AI, Cloud, and Web3 in this grand technological hackathon of Artimas.',
    registerUrl: '/events/hackmatrix/register',
    rulebookUrl: '/events/hackmatrix/rulebook',
    fee: 200,
    ruleSubtitle: '36-HOUR CODING CRUCIBLE | 2 TO 4 MEMBERS PER TEAM',
    sanskritMantra: '॥ सत्यं ज्ञानमनन्तं ब्रह्म ॥',
    mythicCrest: 'lotus',
    dharmaLevel: 'DHARMA 4/4',
    prizePool: '₹50,000 PRIZE POOL',
    teamConfig: {
      minMembers: 2,
      maxMembers: 4,
      isCompulsoryFixed: false,
      memberLabelPrefix: 'Member',
      addMemberPrompt: '+ Add Member (Max 4 Members)',
    },
    aliases: ['hack-matrix'],
  },
  {
    id: 2,
    slug: 'surprise-event',
    name: 'Surprise Event',
    category: 'Secret Revelation',
    yuga: 'Satya Yuga',
    tagline: 'An Unannounced Mystical Challenge',
    trialSubtitle: 'THE UNANNOUNCED REVELATION',
    shortDescription: 'A classified celestial trial unveiled on festival day.',
    dateLocation: '18 OCTOBER 2026  ·  SECRET ARENA',
    description: 'A classified revelation waiting to be unlocked on the day of the festival.',
    registerUrl: '/events/surprise-event/register',
    rulebookUrl: '/events/surprise-event/rulebook',
    fee: 100,
    ruleSubtitle: 'MYSTICAL REVELATION | INDIVIDUAL / SQUAD ENTRY',
    sanskritMantra: '॥ गूढं रहस्यं प्रकटीकरोति ॥',
    mythicCrest: 'lotus',
    dharmaLevel: 'DHARMA 4/4',
    prizePool: 'EXCITING REWARDS',
    teamConfig: {
      minMembers: 1,
      maxMembers: 1,
      isCompulsoryFixed: true,
      memberLabelPrefix: 'Participant',
      addMemberPrompt: 'Individual Entry',
    },
    aliases: ['surprise', 'secret-event'],
  },
  {
    id: 3,
    slug: 'sage-conclave',
    name: 'Sage Conclave',
    category: 'Keynote & AI Summit',
    yuga: 'Satya Yuga',
    tagline: 'Visionary Tech Masterclass & Keynotes',
    trialSubtitle: 'THE DISCOURSE OF WISDOM',
    shortDescription: 'Keynote addresses, AI symposiums, and visionary masterclasses.',
    dateLocation: '18 OCTOBER 2026  ·  AUDITORIUM',
    description: 'Gather with industry pioneers, AI researchers, and master engineers exploring next-generation technological horizons.',
    registerUrl: '/events/sage-conclave/register',
    rulebookUrl: '/events/sage-conclave/rulebook',
    fee: 100,
    ruleSubtitle: 'SYMPOSIUM & MASTERCLASS | OPEN PASS',
    sanskritMantra: '॥ ऋषीणां ज्ञानप्रवाहः ॥',
    mythicCrest: 'lotus',
    dharmaLevel: 'DHARMA 4/4',
    prizePool: 'SUMMIT CERTIFICATES',
    teamConfig: {
      minMembers: 1,
      maxMembers: 1,
      isCompulsoryFixed: true,
      memberLabelPrefix: 'Attendee',
      addMemberPrompt: 'Individual Entry',
    },
    aliases: ['sageconclave', 'ai-conclave'],
  },

  // ── TRETA YUGA: THE SILVER AGE OF SACRIFICE & VALOR (3 Events) ──
  {
    id: 4,
    slug: 'houdini-hiest',
    name: 'Houdini Heist',
    category: 'Mystery & Escape Quest',
    yuga: 'Treta Yuga',
    tagline: 'Unlock The Enigma & Master The Great Escape',
    trialSubtitle: 'THE ENIGMA OF ESCAPE',
    shortDescription: 'Celestial puzzles, cryptic riddles and the great escape.',
    dateLocation: '19 OCTOBER 2026  ·  CAMPUS ARENA',
    description: 'Solve intricate celestial puzzles, decode mystical cryptograms, and orchestrate the ultimate heist.',
    registerUrl: '/events/houdini-hiest/register',
    rulebookUrl: '/events/houdini-hiest/rulebook',
    fee: 150,
    ruleSubtitle: 'ESCAPE ROOM CHALLENGE | EXACTLY 3 MEMBERS REQUIRED PER TEAM',
    sanskritMantra: '॥ पराक्रमेण लभ्यते विजयः ॥',
    mythicCrest: 'solar',
    dharmaLevel: 'DHARMA 3/4',
    prizePool: '₹20,000 PRIZE POOL',
    teamConfig: {
      minMembers: 3,
      maxMembers: 3,
      isCompulsoryFixed: true,
      memberLabelPrefix: 'Member',
      addMemberPrompt: 'Compulsory 3 Members',
    },
    aliases: ['houdini-heist', 'houdiniheist', 'houdinihiest'],
  },
  {
    id: 5,
    slug: 'brandathon',
    name: 'Brandathon',
    category: 'Design & Strategy',
    yuga: 'Treta Yuga',
    tagline: 'The Cosmic Brand Genesis & Marketing Sprint',
    trialSubtitle: 'THE BRAND GENESIS SPRINT',
    shortDescription: 'Craft legendary brand identities & viral futuristic narratives.',
    dateLocation: '19 OCTOBER 2026  ·  CAMPUS ARENA',
    description: 'Craft legendary brand identities, viral narratives, and futuristic product marketing campaigns.',
    registerUrl: '/events/brandathon/register',
    rulebookUrl: '/events/brandathon/rulebook',
    fee: 150,
    ruleSubtitle: 'BRANDING & MARKETING SPRINT | 2 TO 4 MEMBERS PER TEAM',
    sanskritMantra: '॥ सूर्यवंशी कीर्तिस्तम्भः ॥',
    mythicCrest: 'solar',
    dharmaLevel: 'DHARMA 3/4',
    prizePool: '₹25,000 PRIZE POOL',
    teamConfig: {
      minMembers: 2,
      maxMembers: 4,
      isCompulsoryFixed: false,
      memberLabelPrefix: 'Member',
      addMemberPrompt: '+ Add Member (Max 4 Members)',
    },
    aliases: ['brand-thon'],
  },

  // ── DWAPARA YUGA: THE BRONZE AGE OF STRATEGY & WARRIORS (3 Events) ──
  {
    id: 7,
    slug: 'datathon',
    name: 'Datathon',
    category: 'Data Science & AI',
    yuga: 'Dwapara Yuga',
    tagline: 'Decipher Patterns Across The Data Cosmos',
    trialSubtitle: 'THE COSMIC DATA ODYSSEY',
    shortDescription: 'Decipher patterns across machine intelligence & data depth.',
    dateLocation: '19 OCTOBER 2026  ·  ONLINE',
    description: 'Harness machine learning models, statistical depth, and data intuition to extract hidden truth.',
    registerUrl: '/events/datathon/register',
    rulebookUrl: '/events/datathon/rulebook',
    fee: 150,
    ruleSubtitle: 'DATA SCIENCE CHALLENGE | MAX 2 MEMBERS PER TEAM',
    sanskritMantra: '॥ योगः कर्मसु कौशलम् ॥',
    mythicCrest: 'chakra',
    dharmaLevel: 'DHARMA 2/4',
    prizePool: '₹30,000 PRIZE POOL',
    teamConfig: {
      minMembers: 1,
      maxMembers: 2,
      isCompulsoryFixed: false,
      memberLabelPrefix: 'Member',
      addMemberPrompt: '+ Add Member 2 (Max 2 Members)',
    },
    aliases: ['data-thon'],
  },
  {
    id: 8,
    slug: 'capture-the-flag',
    name: 'Capture the Flag (CTF)',
    category: 'Cybersecurity & War Games',
    yuga: 'Dwapara Yuga',
    tagline: 'Celestial Cyber Warfare & Exploitation Arena',
    trialSubtitle: 'THE CELESTIAL CYBER ARENA',
    shortDescription: 'Exploit vulnerabilities, binary reversing & cyber warfare.',
    dateLocation: '20 OCTOBER 2026  ·  ONLINE',
    description: 'Exploit binary vulnerabilities, crack reverse engineering puzzles, and conquer the cyber realm.',
    registerUrl: '/events/capture-the-flag/register',
    rulebookUrl: '/events/capture-the-flag/rulebook',
    fee: 150,
    ruleSubtitle: 'CYBER WARFARE ARENA | 1 TO 3 MEMBERS PER TEAM',
    sanskritMantra: '॥ व्यूहरचना भेदनम् ॥',
    mythicCrest: 'chakra',
    dharmaLevel: 'DHARMA 2/4',
    prizePool: '₹25,000 PRIZE POOL',
    teamConfig: {
      minMembers: 1,
      maxMembers: 3,
      isCompulsoryFixed: false,
      memberLabelPrefix: 'Member',
      addMemberPrompt: '+ Add Member (Max 3 Members)',
    },
    aliases: ['ctf'],
  },
  {
    id: 9,
    slug: 'code-kurukshetra',
    name: 'Code Kurukshetra',
    category: 'Competitive Programming',
    yuga: 'Dwapara Yuga',
    tagline: 'The Ultimate Algorithmic Battlefield',
    trialSubtitle: 'THE ARENA OF ALGORITHMS',
    shortDescription: 'High-speed algorithmic problem solving & data structures duel.',
    dateLocation: '20 OCTOBER 2026  ·  ONLINE',
    description: 'Battle against time and elite programmers across complex dynamic programming, graph traversal, and mathematical optimization problems.',
    registerUrl: '/events/code-kurukshetra/register',
    rulebookUrl: '/events/code-kurukshetra/rulebook',
    fee: 100,
    ruleSubtitle: 'ALGORITHMIC DUEL | INDIVIDUAL ENTRY',
    sanskritMantra: '॥ कुरुक्षेत्रे तीव्रबुद्धिः ॥',
    mythicCrest: 'chakra',
    dharmaLevel: 'DHARMA 2/4',
    prizePool: '₹20,000 PRIZE POOL',
    teamConfig: {
      minMembers: 1,
      maxMembers: 1,
      isCompulsoryFixed: true,
      memberLabelPrefix: 'Coder',
      addMemberPrompt: 'Individual Entry',
    },
    aliases: ['kurukshetra', 'competitive-coding'],
  },

  // ── KALI YUGA: THE IRON AGE OF ENTROPY & KALKI (3 Events) ──
  {
    id: 10,
    slug: 'prompt-relay',
    name: 'Prompt Relay',
    category: 'Generative AI Sprint',
    yuga: 'Kali Yuga',
    tagline: 'High-Speed Prompt Engineering Duel',
    trialSubtitle: 'THE GENERATIVE AI DUEL',
    shortDescription: 'High-speed prompt engineering & multimodal AI duel.',
    dateLocation: '20 OCTOBER 2026  ·  ONLINE',
    description: 'Relay through rapid-fire LLM challenges, multimodal synthesis, and precision prompt optimization.',
    registerUrl: '/events/prompt-relay/register',
    rulebookUrl: '/events/prompt-relay/rulebook',
    fee: 100,
    ruleSubtitle: 'PROMPT RELAY SPRINT | MAX 3 MEMBERS PER TEAM',
    sanskritMantra: '॥ कलियुगे संकल्पास्त्रम् ॥',
    mythicCrest: 'blade',
    dharmaLevel: 'DHARMA 1/4',
    prizePool: '₹15,000 PRIZE POOL',
    teamConfig: {
      minMembers: 1,
      maxMembers: 3,
      isCompulsoryFixed: false,
      memberLabelPrefix: 'Member',
      addMemberPrompt: '+ Add Member (Max 3 Members)',
    },
    aliases: ['promptrelay'],
  },
  {
    id: 11,
    slug: 'among-us',
    name: 'Among Us',
    category: 'Gaming & Social Deduction',
    yuga: 'Kali Yuga',
    tagline: 'Trust, Deception & Cosmic Survival',
    trialSubtitle: 'TRUST, DECEPTION & SURVIVAL',
    shortDescription: 'Uncover the impostors sabotaging the celestial starship.',
    dateLocation: '20 OCTOBER 2026  ·  CAMPUS ARENA',
    description: 'Uncover the impostors sabotaging the celestial starship before the cosmic cycle collapses.',
    registerUrl: '/events/among-us/register',
    rulebookUrl: '/events/among-us/rulebook',
    fee: 50,
    ruleSubtitle: 'SOCIAL DEDUCTION BATTLE | INDIVIDUAL ENTRY',
    sanskritMantra: '॥ मायाजाल विच्छेदनम् ॥',
    mythicCrest: 'blade',
    dharmaLevel: 'DHARMA 1/4',
    prizePool: '₹10,000 PRIZE POOL',
    teamConfig: {
      minMembers: 1,
      maxMembers: 1,
      isCompulsoryFixed: true,
      memberLabelPrefix: 'Participant',
      addMemberPrompt: 'Individual Entry',
    },
    aliases: ['amongus', 'among-us'],
  },
  {
    id: 12,
    slug: 'cyber-warzone',
    name: 'Cyber Warzone',
    category: 'Esports Battlefield',
    yuga: 'Kali Yuga',
    tagline: 'Tactical Combat & Esports Championship',
    trialSubtitle: 'THE WARZONE CLASH',
    shortDescription: 'Squad-based tactical battlefield tournament.',
    dateLocation: '20 OCTOBER 2026  ·  LAN ARENA',
    description: 'Assemble your clan for tactical battlefield rounds in the high-octane collegiate esports arena of Artimas.',
    registerUrl: '/events/cyber-warzone/register',
    rulebookUrl: '/events/cyber-warzone/rulebook',
    fee: 150,
    ruleSubtitle: 'ESPORTS TOURNAMENT | 4 MEMBERS PER SQUAD',
    sanskritMantra: '॥ अन्तिम रणक्षेत्रम् ॥',
    mythicCrest: 'blade',
    dharmaLevel: 'DHARMA 1/4',
    prizePool: '₹25,000 PRIZE POOL',
    teamConfig: {
      minMembers: 4,
      maxMembers: 4,
      isCompulsoryFixed: true,
      memberLabelPrefix: 'Player',
      addMemberPrompt: 'Squad of 4 Players',
    },
    aliases: ['warzone', 'esports', 'bgmi'],
  },
];

export function getEventBySlug(slug: string): EventItem | undefined {
  const normalized = slug.toLowerCase().trim();
  return EVENTS.find(
    event => event.slug === normalized || (event.aliases && event.aliases.includes(normalized))
  );
}

export function getAllEvents(): EventItem[] {
  return EVENTS;
}
