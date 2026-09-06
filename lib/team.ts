export interface TeamMember {
  id: string;
  name: string;
  role?: string;
  description?: string;
  photoUrl: string;
  cropPhotoUrl: string;
  socials?: {
    instagram?: string;
    linkedin?: string;
    github?: string;
  };
}

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'hari-chaudhari',
    name: 'Hari Chaudhari',
    role: 'Grand Architect',
    description: 'Sovereign keeper of the sacred forge, commanding ancient scripts and bending the digital cosmos to his royal will.',
    photoUrl: '/images/team/Hari.png',
    cropPhotoUrl: '/images/team/hari-crop.webp',
    socials: {
      instagram: 'https://www.instagram.com/_w_asd?igsi=eGwyb3RzYXA1YzVt',
      linkedin: 'https://www.linkedin.com/in/hari-chaudhari-96306133b/',
      github: 'https://github.com/OverRide21',
    },
  },
  {
    id: 'nirbhay-gajabi',
    name: 'Nirbhay Gajabi',
    role: 'High Commander',
    description: 'Fearless champion of the inner bastion, whose steadfast resolve and valor fortify the realm against all trials.',
    photoUrl: '/images/team/Nirbhay.png',
    cropPhotoUrl: '/images/team/nirbhay-crop.webp',
    socials: {
      instagram: 'https://www.instagram.com/nirbhaygajabi?igsi=aXFwbWtmMnBoY2Jy',
      linkedin: 'https://www.linkedin.com/in/nirbhay-gajabi-30321432b?utm_source=share_via&utm_content=profile&utm_medium=member_android',
      github: 'https://github.com/Nirbhay3006',
    },
  },
  {
    id: 'meet-ramjiyani',
    name: 'Meet Ramjiyani',
    role: 'Grand Chronicler',
    description: 'Master of arcane codices and weaver of unseen realms, breathing life and mythic order into visionary dynasties.',
    photoUrl: '/images/team/Meet.png',
    cropPhotoUrl: '/images/team/meet-crop.webp',
    socials: {
      instagram: 'https://www.instagram.com/meet.patel_10?igsi=dGo5bWRtazFqcGpp',
      linkedin: 'https://www.linkedin.com/in/meet-ramjiyani-80821432b/',
      github: 'https://github.com/Meet-Ramjiyani-10',
    },
  },
  {
    id: 'jatin-patil',
    name: 'Jatin Patil',
    role: 'Lord of Cyphers',
    description: 'Vigilant keeper of the gilded vaults, forging impenetrable logic and unraveling complex enigmas with sharp precision.',
    photoUrl: '/images/team/Jatin.png',
    cropPhotoUrl: '/images/team/jatin-crop.webp',
    socials: {
      instagram: 'https://www.instagram.com/25.3_jatin?igsi=bmljbm8zcDNoZ2Fs',
      linkedin: 'https://www.linkedin.com/in/jatin-patil-b84a2a3b0/',
      github: 'https://github.com/Jatinnnit',
    },
  },
  {
    id: 'anuska',
    name: 'Anuska Misra',
    role: 'Scribe of Elegance',
    description: 'Weaver of aesthetic harmony and golden prose, gracing every council decree with visual splendor and poise.',
    photoUrl: '/images/team/Anuska.png',
    cropPhotoUrl: '/images/team/anuska-crop.webp',
    socials: {
      instagram: 'https://www.instagram.com/anuska0611?stkn=MXc5YXlkZ3MxMXJ6Mw==',
      linkedin: 'https://www.linkedin.com/in/anuska-misra-675b85370',
      github: 'https://github.com/anuska3006',
    },
  },
  {
    id: 'hrishikesh',
    name: 'Hrishikesh Bhande',
    role: 'Warden of the Watch',
    description: 'Stalwart shield of the castle gates, ever vigilant in orchestrating discipline and order across the kingdom.',
    photoUrl: '/images/team/Hrishikesh.png',
    cropPhotoUrl: '/images/team/hrishikesh-crop.webp',
    socials: {
      instagram: 'https://www.instagram.com/hrishy_08?igsi=Mm80eGdhZXR0Mm91',
      linkedin: 'https://www.linkedin.com/in/hrishikesh-bhande-b26407252/',
      github: 'https://github.com/HrishikeshBhande06',
    },
  },
  {
    id: 'sarfaraz-khan',
    name: 'Sarfaraz Khan',
    role: 'Herald of the Realm',
    description: 'Resolute emissary of the conclave, marshaling the grand assemblies and sounding the horns of triumph.',
    photoUrl: '/images/team/sarfaraz.png',
    cropPhotoUrl: '/images/team/sarfaraz-crop.webp',
    socials: {
      instagram: 'https://www.instagram.com/_sarfaraz9/',
      linkedin: 'https://www.linkedin.com/in/sarfaraz-khan-82013a328',
      github: 'https://github.com/sarfarazkhan24',
    },
  },
];
