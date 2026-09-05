export interface TeamConfig {
  minMembers: number;
  maxMembers: number;
  allowedTeamSizes?: number[];
  isCompulsoryFixed?: boolean;
  memberLabelPrefix?: string;
  addMemberPrompt?: string;
}

export interface EventItem {
  id: number;
  slug: string;
  overheadTitle?: string;
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
  paymentQrUrl?: string;
  upiId?: string;
}

export const EVENTS: EventItem[] = [
  // ── SATYA YUGA: THE GOLDEN AGE OF TRUTH & SAGES (2 Events) ──
  {
    id: 1,
    slug: 'datathon',
    name: 'Datathon',
    category: 'Data Science & AI',
    yuga: 'Satya Yuga',
    tagline: 'Decipher Patterns Across The Data Cosmos',
    trialSubtitle: 'THE COSMIC DATA ODYSSEY',
    shortDescription: 'Dive into data-driven challenges and showcase your analytics skills. Compete with the brightest minds to extract insights from complex datasets.',
    dateLocation: '18 OCTOBER 2026  ·  ONLINE',
    description: 'Dive into data-driven challenges and showcase your analytics skills. Compete with the brightest minds to extract insights from complex datasets.',
    registerUrl: '/events/datathon/register',
    rulebookUrl: '/events/datathon/rulebook',
    fee: 150,
    ruleSubtitle: 'DATA SCIENCE CHALLENGE | MAX 2 MEMBERS PER TEAM',
    sanskritMantra: '॥ सत्यं ज्ञानमनन्तं ब्रह्म ॥',
    mythicCrest: 'lotus',
    dharmaLevel: 'DHARMA 4/4',
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
    id: 2,
    slug: 'pixel-perfect',
    name: 'Surprise Event',
    category: 'Competitive Photography',
    yuga: 'Satya Yuga',
    tagline: 'Capture The Moment Through Your Lens',
    trialSubtitle: 'THE PHOTOGRAPHIC VISION TRIAL',
    shortDescription: 'Capture the moment through your lens! Showcase your photography skills and artistic vision in this competitive photography event. Express your creativity and tell stories through stunning images.',
    dateLocation: '11 OCTOBER 2026  ·  CAMPUS ARENA',
    description: 'Capture the moment through your lens! Showcase your photography skills and artistic vision in this competitive photography event. Express your creativity and tell stories through stunning images.',
    registerUrl: '/events/pixel-perfect/register',
    rulebookUrl: '/events/pixel-perfect/rulebook',
    fee: 100,
    ruleSubtitle: 'COMPETITIVE PHOTOGRAPHY | 1 ROUND TRIAL',
    sanskritMantra: '॥ रूपं दृश्यते नयनेन ॥',
    mythicCrest: 'lotus',
    dharmaLevel: 'DHARMA 4/4',
    prizePool: 'EXCITING REWARDS',
    teamConfig: {
      minMembers: 1,
      maxMembers: 1,
      isCompulsoryFixed: true,
      memberLabelPrefix: 'Photographer',
      addMemberPrompt: 'Individual Entry',
    },
    aliases: ['surprise-event', 'surprise', 'pixelperfect', 'photography', 'secret-event'],
  },

  // ── TRETA YUGA: THE SILVER AGE OF SACRIFICE & VALOR (2 Events) ──
  {
    id: 3,
    slug: 'prompt-relay',
    name: 'Prompt Relay',
    category: 'Generative AI Sprint',
    yuga: 'Treta Yuga',
    tagline: 'High-Speed Prompt Engineering Duel',
    trialSubtitle: 'THE GENERATIVE AI DUEL',
    shortDescription: 'Test your knowledge of technology, programming, and innovation. Compete in fast-paced quiz rounds against skilled competitors.',
    dateLocation: '19 OCTOBER 2026  ·  CAMPUS ARENA',
    description: 'Test your knowledge of technology, programming, and innovation. Compete in fast-paced quiz rounds against skilled competitors.',
    registerUrl: '/events/prompt-relay/register',
    rulebookUrl: '/events/prompt-relay/rulebook',
    fee: 150,
    ruleSubtitle: 'PROMPT RELAY SPRINT | 1 TO 3 MEMBERS PER TEAM',
    sanskritMantra: '॥ पराक्रमेण लभ्यते विजयः ॥',
    mythicCrest: 'solar',
    dharmaLevel: 'DHARMA 3/4',
    prizePool: '₹20,000 PRIZE POOL',
    teamConfig: {
      minMembers: 1,
      maxMembers: 3,
      isCompulsoryFixed: false,
      memberLabelPrefix: 'Member',
      addMemberPrompt: '+ Add Member (Max 3 Members)',
    },
    aliases: ['promptrelay', 'prompt-relay'],
  },
  {
    id: 4,
    slug: 'brandathon',
    overheadTitle: 'Abhikalp',
    name: 'Brandathon',
    category: 'Design & Strategy',
    yuga: 'Treta Yuga',
    tagline: 'The Cosmic Brand Genesis & Marketing Sprint',
    trialSubtitle: 'THE BRAND GENESIS SPRINT',
    shortDescription: 'Unleash your creativity in brand strategy, design, and storytelling. Compete to build compelling brand identities and pitch game-changing campaigns.',
    dateLocation: '19 OCTOBER 2026  ·  CAMPUS ARENA',
    description: 'Unleash your creativity in brand strategy, design, and storytelling. Compete to build compelling brand identities and pitch game-changing campaigns.',
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
    aliases: ['brand-thon', 'abhikalp'],
  },

  // ── DWAPARA YUGA: THE BRONZE AGE OF STRATEGY & WARRIORS (2 Events) ──
  {
    id: 8,
    slug: 'capture-the-flag',
    overheadTitle: 'Kurukshetra',
    name: 'Capture the Flag',
    category: 'Cybersecurity & War Games',
    yuga: 'Dwapara Yuga',
    tagline: 'Celestial Cyber Warfare & Exploitation Arena',
    trialSubtitle: 'THE CELESTIAL CYBER ARENA',
    shortDescription: 'Dive into intense cybersecurity challenges and showcase your ethical hacking skills. Compete to exploit vulnerabilities, crack ciphers, and capture the flags.',
    dateLocation: '20 OCTOBER 2026  ·  ONLINE',
    description: 'Dive into intense cybersecurity challenges and showcase your ethical hacking skills. Compete to exploit vulnerabilities, crack ciphers, and capture the flags.',
    registerUrl: '/events/capture-the-flag/register',
    rulebookUrl: '/events/capture-the-flag/rulebook',
    fee: 150,
    ruleSubtitle: 'CYBER WARFARE ARENA | EXACTLY 2 OR 4 MEMBERS PER TEAM',
    sanskritMantra: '॥ व्यूहरचना भेदनम् ॥',
    mythicCrest: 'chakra',
    dharmaLevel: 'DHARMA 2/4',
    prizePool: '₹25,000 PRIZE POOL',
    teamConfig: {
      minMembers: 2,
      maxMembers: 4,
      allowedTeamSizes: [2, 4],
      isCompulsoryFixed: false,
      memberLabelPrefix: 'Agent',
      addMemberPrompt: '+ Add Team Member (2 or 4 Members only)',
    },
    aliases: ['ctf', 'kurukshetra'],
  },
  {
    id: 9,
    slug: 'houdini-heist',
    name: 'Houdini Heist',
    category: 'Mystery & Escape Quest',
    yuga: 'Dwapara Yuga',
    tagline: 'Unlock The Enigma & Master The Great Escape',
    trialSubtitle: 'THE ENIGMA OF ESCAPE',
    shortDescription: 'Face mysterious puzzles and riddles in this thrilling event. Test your logic, creativity, and problem-solving abilities in an immersive experience.',
    dateLocation: '20 OCTOBER 2026  ·  CAMPUS ARENA',
    description: 'Face mysterious puzzles and riddles in this thrilling event. Test your logic, creativity, and problem-solving abilities in an immersive experience.',
    registerUrl: '/events/houdini-heist/register',
    rulebookUrl: '/events/houdini-heist/rulebook',
    fee: 150,
    ruleSubtitle: 'ESCAPE ROOM CHALLENGE | EXACTLY 3 MEMBERS REQUIRED PER TEAM',
    sanskritMantra: '॥ कुरुक्षेत्रे तीव्रबुद्धिः ॥',
    mythicCrest: 'chakra',
    dharmaLevel: 'DHARMA 2/4',
    prizePool: '₹20,000 PRIZE POOL',
    teamConfig: {
      minMembers: 3,
      maxMembers: 3,
      isCompulsoryFixed: true,
      memberLabelPrefix: 'Member',
      addMemberPrompt: 'Compulsory 3 Members',
    },
    aliases: ['houdini-heist', 'houdiniheist', 'houdini-hiest', 'houdini', 'kurukshetra', 'code-kurukshetra'],
  },

  // ── KALI YUGA: THE IRON AGE OF ENTROPY & KALKI (2 Events) ──
  {
    id: 11,
    slug: 'among-us',
    name: 'Among Us',
    category: 'Gaming & Social Deduction',
    yuga: 'Kali Yuga',
    tagline: 'Trust, Deception & Cosmic Survival',
    trialSubtitle: 'TRUST, DECEPTION & SURVIVAL',
    shortDescription: 'Strategic gameplay meets social deduction. Work together or play against each other in this intense and entertaining event.',
    dateLocation: '20 OCTOBER 2026  ·  CAMPUS ARENA',
    description: 'Strategic gameplay meets social deduction. Work together or play against each other in this intense and entertaining event.',
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
    slug: 'hackmatrix',
    name: 'HackMatrix',
    category: 'Hackathon & Engineering',
    yuga: 'Kali Yuga',
    tagline: 'The Cosmic 24-Hour Code & Build Matrix',
    trialSubtitle: 'THE MATRIX OF CODE & CREATION',
    shortDescription: 'A national-level hackathon bringing together innovators, creators, and problem-solvers to build solutions that matter. Join us to turn bold ideas into transformative realities.',
    dateLocation: '20 OCTOBER 2026  ·  HACK ARENA',
    description: 'A national-level hackathon bringing together innovators, creators, and problem-solvers to build solutions that matter. Join us to turn bold ideas into transformative realities.',
    registerUrl: '/events/hackmatrix/register',
    rulebookUrl: '/events/hackmatrix/rulebook',
    fee: 150,
    ruleSubtitle: 'HACKATHON SPRINT | 2 TO 4 MEMBERS PER TEAM',
    sanskritMantra: '॥ अन्तिम रणक्षेत्रम् ॥',
    mythicCrest: 'blade',
    dharmaLevel: 'DHARMA 1/4',
    prizePool: '₹30,000 PRIZE POOL',
    teamConfig: {
      minMembers: 2,
      maxMembers: 4,
      isCompulsoryFixed: false,
      memberLabelPrefix: 'Hacker',
      addMemberPrompt: '+ Add Member (Max 4 Members)',
    },
    aliases: ['hackmatrix', 'hack-matrix', 'matrix', 'cyber-warzone', 'warzone', 'esports'],
  },
];

export function getEventBySlug(slug: string): EventItem | undefined {
  const normalized = slug.toLowerCase().trim();
  return EVENTS.find(
    event => event.slug === normalized || (event.aliases && event.aliases.includes(normalized))
  );
}
