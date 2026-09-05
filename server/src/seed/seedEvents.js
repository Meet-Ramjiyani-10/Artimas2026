/**
 * Seed script — Populates the Events collection with all ARTIMAS 26 events.
 *
 * Run: npm run seed:events
 *
 * This mirrors the data from the frontend's lib/events.ts, adding dynamic
 * registration form fields that match the existing EventRegistrationWizard.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Event = require('../models/Event');

// Standard per-member registration fields (matching the frontend wizard)
const standardMemberFields = [
  {
    name: 'name',
    label: 'Full Name',
    type: 'text',
    required: true,
    placeholder: 'FULL NAME',
  },
  {
    name: 'email',
    label: 'Email ID',
    type: 'email',
    required: true,
    placeholder: 'EMAIL ID',
  },
  {
    name: 'phone',
    label: 'Phone Number',
    type: 'phone',
    required: true,
    placeholder: 'PHONE NUMBER',
  },
  {
    name: 'college',
    label: 'College',
    type: 'text',
    required: true,
    placeholder: 'COLLEGE',
  },
  {
    name: 'year',
    label: 'Year',
    type: 'select',
    required: true,
    options: ['FE', 'SE', 'TE', 'BE'],
    placeholder: 'SELECT YEAR',
  },
  {
    name: 'branch',
    label: 'Branch',
    type: 'text',
    required: true,
    placeholder: 'BRANCH',
  },
];

const events = [
  // ── SATYA YUGA ──
  {
    name: 'Datathon',
    slug: 'datathon',
    category: 'Data Science & AI',
    yuga: 'Satya Yuga',
    tagline: 'Decipher Patterns Across The Data Cosmos',
    trialSubtitle: 'THE COSMIC DATA ODYSSEY',
    shortDescription:
      'Dive into data-driven challenges and showcase your analytics skills. Compete with the brightest minds to extract insights from complex datasets.',
    description:
      'Dive into data-driven challenges and showcase your analytics skills. Compete with the brightest minds to extract insights from complex datasets.',
    dateLocation: '18 OCTOBER 2026  ·  ONLINE',
    registrationFee: 150,
    ruleSubtitle: 'DATA SCIENCE CHALLENGE | MAX 2 MEMBERS PER TEAM',
    sanskritMantra: '॥ सत्यं ज्ञानमनन्तं ब्रह्म ॥',
    mythicCrest: 'lotus',
    dharmaLevel: 'DHARMA 4/4',
    prizePool: '₹30,000 PRIZE POOL',
    registerUrl: '/events/datathon/register',
    rulebookUrl: '/events/datathon/rulebook',
    aliases: ['data-thon'],
    teamConfig: {
      minMembers: 1,
      maxMembers: 2,
      isCompulsoryFixed: false,
      memberLabelPrefix: 'Member',
      addMemberPrompt: '+ Add Member 2 (Max 2 Members)',
    },
    fields: standardMemberFields,
    active: true,
  },
  {
    name: 'Surprise Event',
    slug: 'pixel-perfect',
    category: 'Competitive Photography',
    yuga: 'Satya Yuga',
    tagline: 'Capture The Moment Through Your Lens',
    trialSubtitle: 'THE PHOTOGRAPHIC VISION TRIAL',
    shortDescription:
      'Capture the moment through your lens! Showcase your photography skills and artistic vision in this competitive photography event.',
    description:
      'Capture the moment through your lens! Showcase your photography skills and artistic vision in this competitive photography event. Express your creativity and tell stories through stunning images.',
    dateLocation: '11 OCTOBER 2026  ·  CAMPUS ARENA',
    registrationFee: 100,
    ruleSubtitle: 'COMPETITIVE PHOTOGRAPHY | 1 ROUND TRIAL',
    sanskritMantra: '॥ रूपं दृश्यते नयनेन ॥',
    mythicCrest: 'lotus',
    dharmaLevel: 'DHARMA 4/4',
    prizePool: 'EXCITING REWARDS',
    registerUrl: '/events/pixel-perfect/register',
    rulebookUrl: '/events/pixel-perfect/rulebook',
    aliases: ['surprise-event', 'surprise', 'pixelperfect', 'photography', 'secret-event'],
    teamConfig: {
      minMembers: 1,
      maxMembers: 1,
      isCompulsoryFixed: true,
      memberLabelPrefix: 'Photographer',
      addMemberPrompt: 'Individual Entry',
    },
    fields: standardMemberFields,
    active: true,
  },

  // ── TRETA YUGA ──
  {
    name: 'Prompt Relay',
    slug: 'prompt-relay',
    category: 'Generative AI Sprint',
    yuga: 'Treta Yuga',
    tagline: 'High-Speed Prompt Engineering Duel',
    trialSubtitle: 'THE GENERATIVE AI DUEL',
    shortDescription:
      'Test your knowledge of technology, programming, and innovation. Compete in fast-paced quiz rounds against skilled competitors.',
    description:
      'Test your knowledge of technology, programming, and innovation. Compete in fast-paced quiz rounds against skilled competitors.',
    dateLocation: '19 OCTOBER 2026  ·  CAMPUS ARENA',
    registrationFee: 150,
    ruleSubtitle: 'PROMPT RELAY SPRINT | 1 TO 3 MEMBERS PER TEAM',
    sanskritMantra: '॥ पराक्रमेण लभ्यते विजयः ॥',
    mythicCrest: 'solar',
    dharmaLevel: 'DHARMA 3/4',
    prizePool: '₹20,000 PRIZE POOL',
    registerUrl: '/events/prompt-relay/register',
    rulebookUrl: '/events/prompt-relay/rulebook',
    aliases: ['promptrelay', 'prompt-relay'],
    teamConfig: {
      minMembers: 1,
      maxMembers: 3,
      isCompulsoryFixed: false,
      memberLabelPrefix: 'Member',
      addMemberPrompt: '+ Add Member (Max 3 Members)',
    },
    fields: standardMemberFields,
    active: true,
  },
  {
    name: 'Brandathon',
    slug: 'brandathon',
    category: 'Design & Strategy',
    yuga: 'Treta Yuga',
    tagline: 'The Cosmic Brand Genesis & Marketing Sprint',
    trialSubtitle: 'THE BRAND GENESIS SPRINT',
    shortDescription:
      'Unleash your creativity in brand strategy, design, and storytelling. Compete to build compelling brand identities and pitch game-changing campaigns.',
    description:
      'Unleash your creativity in brand strategy, design, and storytelling. Compete to build compelling brand identities and pitch game-changing campaigns.',
    dateLocation: '19 OCTOBER 2026  ·  CAMPUS ARENA',
    registrationFee: 150,
    ruleSubtitle: 'BRANDING & MARKETING SPRINT | 2 TO 4 MEMBERS PER TEAM',
    sanskritMantra: '॥ सूर्यवंशी कीर्तिस्तम्भः ॥',
    mythicCrest: 'solar',
    dharmaLevel: 'DHARMA 3/4',
    prizePool: '₹25,000 PRIZE POOL',
    registerUrl: '/events/brandathon/register',
    rulebookUrl: '/events/brandathon/rulebook',
    aliases: ['brand-thon'],
    teamConfig: {
      minMembers: 2,
      maxMembers: 4,
      isCompulsoryFixed: false,
      memberLabelPrefix: 'Member',
      addMemberPrompt: '+ Add Member (Max 4 Members)',
    },
    fields: standardMemberFields,
    active: true,
  },

  // ── DWAPARA YUGA ──
  {
    name: 'Capture the Flag (CTF)',
    slug: 'capture-the-flag',
    category: 'Cybersecurity & War Games',
    yuga: 'Dwapara Yuga',
    tagline: 'Celestial Cyber Warfare & Exploitation Arena',
    trialSubtitle: 'THE CELESTIAL CYBER ARENA',
    shortDescription:
      'Dive into intense cybersecurity challenges and showcase your ethical hacking skills. Compete to exploit vulnerabilities, crack ciphers, and capture the flags.',
    description:
      'Dive into intense cybersecurity challenges and showcase your ethical hacking skills. Compete to exploit vulnerabilities, crack ciphers, and capture the flags.',
    dateLocation: '20 OCTOBER 2026  ·  ONLINE',
    registrationFee: 150,
    ruleSubtitle: 'CYBER WARFARE ARENA | EXACTLY 2 OR 4 MEMBERS PER TEAM',
    sanskritMantra: '॥ व्यूहरचना भेदनम् ॥',
    mythicCrest: 'chakra',
    dharmaLevel: 'DHARMA 2/4',
    prizePool: '₹25,000 PRIZE POOL',
    registerUrl: '/events/capture-the-flag/register',
    rulebookUrl: '/events/capture-the-flag/rulebook',
    aliases: ['ctf'],
    teamConfig: {
      minMembers: 2,
      maxMembers: 4,
      allowedTeamSizes: [2, 4],
      isCompulsoryFixed: false,
      memberLabelPrefix: 'Agent',
      addMemberPrompt: '+ Add Team Member (2 or 4 Members only)',
    },
    fields: standardMemberFields,
    active: true,
  },
  {
    name: 'Houdini Heist',
    slug: 'houdini-heist',
    category: 'Mystery & Escape Quest',
    yuga: 'Dwapara Yuga',
    tagline: 'Unlock The Enigma & Master The Great Escape',
    trialSubtitle: 'THE ENIGMA OF ESCAPE',
    shortDescription:
      'Face mysterious puzzles and riddles in this thrilling event. Test your logic, creativity, and problem-solving abilities in an immersive experience.',
    description:
      'Face mysterious puzzles and riddles in this thrilling event. Test your logic, creativity, and problem-solving abilities in an immersive experience.',
    dateLocation: '20 OCTOBER 2026  ·  CAMPUS ARENA',
    registrationFee: 150,
    ruleSubtitle: 'ESCAPE ROOM CHALLENGE | EXACTLY 3 MEMBERS REQUIRED PER TEAM',
    sanskritMantra: '॥ कुरुक्षेत्रे तीव्रबुद्धिः ॥',
    mythicCrest: 'chakra',
    dharmaLevel: 'DHARMA 2/4',
    prizePool: '₹20,000 PRIZE POOL',
    registerUrl: '/events/houdini-heist/register',
    rulebookUrl: '/events/houdini-heist/rulebook',
    aliases: ['houdini-heist', 'houdiniheist', 'houdini-hiest', 'houdini', 'kurukshetra', 'code-kurukshetra'],
    teamConfig: {
      minMembers: 3,
      maxMembers: 3,
      isCompulsoryFixed: true,
      memberLabelPrefix: 'Member',
      addMemberPrompt: 'Compulsory 3 Members',
    },
    fields: standardMemberFields,
    active: true,
  },

  // ── KALI YUGA ──
  {
    name: 'Among Us',
    slug: 'among-us',
    category: 'Gaming & Social Deduction',
    yuga: 'Kali Yuga',
    tagline: 'Trust, Deception & Cosmic Survival',
    trialSubtitle: 'TRUST, DECEPTION & SURVIVAL',
    shortDescription:
      'Strategic gameplay meets social deduction. Work together or play against each other in this intense and entertaining event.',
    description:
      'Strategic gameplay meets social deduction. Work together or play against each other in this intense and entertaining event.',
    dateLocation: '20 OCTOBER 2026  ·  CAMPUS ARENA',
    registrationFee: 50,
    ruleSubtitle: 'SOCIAL DEDUCTION BATTLE | INDIVIDUAL ENTRY',
    sanskritMantra: '॥ मायाजाल विच्छेदनम् ॥',
    mythicCrest: 'blade',
    dharmaLevel: 'DHARMA 1/4',
    prizePool: '₹10,000 PRIZE POOL',
    registerUrl: '/events/among-us/register',
    rulebookUrl: '/events/among-us/rulebook',
    aliases: ['amongus', 'among-us'],
    teamConfig: {
      minMembers: 1,
      maxMembers: 1,
      isCompulsoryFixed: true,
      memberLabelPrefix: 'Participant',
      addMemberPrompt: 'Individual Entry',
    },
    fields: standardMemberFields,
    active: true,
  },
  {
    name: 'HackMatrix',
    slug: 'hackmatrix',
    category: 'Hackathon & Engineering',
    yuga: 'Kali Yuga',
    tagline: 'The Cosmic 24-Hour Code & Build Matrix',
    trialSubtitle: 'THE MATRIX OF CODE & CREATION',
    shortDescription:
      'A national-level hackathon bringing together innovators, creators, and problem-solvers to build solutions that matter.',
    description:
      'A national-level hackathon bringing together innovators, creators, and problem-solvers to build solutions that matter. Join us to turn bold ideas into transformative realities.',
    dateLocation: '20 OCTOBER 2026  ·  HACK ARENA',
    registrationFee: 150,
    ruleSubtitle: 'HACKATHON SPRINT | 2 TO 4 MEMBERS PER TEAM',
    sanskritMantra: '॥ अन्तिम रणक्षेत्रम् ॥',
    mythicCrest: 'blade',
    dharmaLevel: 'DHARMA 1/4',
    prizePool: '₹30,000 PRIZE POOL',
    registerUrl: '/events/hackmatrix/register',
    rulebookUrl: '/events/hackmatrix/rulebook',
    aliases: ['hackmatrix', 'hack-matrix', 'matrix', 'cyber-warzone', 'warzone', 'esports'],
    teamConfig: {
      minMembers: 2,
      maxMembers: 4,
      isCompulsoryFixed: false,
      memberLabelPrefix: 'Hacker',
      addMemberPrompt: '+ Add Member (Max 4 Members)',
    },
    fields: standardMemberFields,
    active: false, // Redirects to external portal
  },
];

const seedEvents = async () => {
  try {
    await connectDB();

    // Clear existing events
    await Event.deleteMany({});
    console.log('✦ Cleared existing events');

    // Insert seed data
    const created = await Event.insertMany(events);
    console.log(`✦ Seeded ${created.length} events successfully:`);
    created.forEach((e) => {
      console.log(`   • ${e.name} (${e.slug}) — ₹${e.registrationFee} — ${e.active ? 'Active' : 'Inactive'}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('✖ Seed error:', error.message);
    process.exit(1);
  }
};

seedEvents();
