export interface TeamMember {
  id: string;
  name: string;
  role?: string;
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
    photoUrl: '/images/team/Hari.png',
    cropPhotoUrl: '/images/team/hari-crop.webp',
    socials: {
      instagram: 'https://www.instagram.com',
      linkedin: 'https://www.linkedin.com',
      github: 'https://github.com',
    },
  },
  {
    id: 'nirbhay-gajabi',
    name: 'Nirbhay Gajabi',
    photoUrl: '/images/team/Nirbhay.png',
    cropPhotoUrl: '/images/team/nirbhay-crop.webp',
    socials: {
      instagram: 'https://www.instagram.com',
      linkedin: 'https://www.linkedin.com',
      github: 'https://github.com',
    },
  },
  {
    id: 'meet-ramjiyani',
    name: 'Meet Ramjiyani',
    photoUrl: '/images/team/Meet.png',
    cropPhotoUrl: '/images/team/meet-crop.webp',
    socials: {
      instagram: 'https://www.instagram.com',
      linkedin: 'https://www.linkedin.com',
      github: 'https://github.com',
    },
  },
  {
    id: 'jatin-patil',
    name: 'Jatin Patil',
    photoUrl: '/images/team/Jatin.png',
    cropPhotoUrl: '/images/team/jatin-crop.webp',
    socials: {
      instagram: 'https://www.instagram.com',
      linkedin: 'https://www.linkedin.com',
      github: 'https://github.com',
    },
  },
  {
    id: 'anuska',
    name: 'Anuska Misra',
    photoUrl: '/images/team/Anuska.png',
    cropPhotoUrl: '/images/team/anuska-crop.webp',
    socials: {
      instagram: 'https://www.instagram.com',
      linkedin: 'https://www.linkedin.com',
      github: 'https://github.com',
    },
  },
  {
    id: 'hrishikesh',
    name: 'Hrishikesh Bhande',
    photoUrl: '/images/team/Hrishikesh.png',
    cropPhotoUrl: '/images/team/hrishikesh-crop.webp',
    socials: {
      instagram: 'https://www.instagram.com',
      linkedin: 'https://www.linkedin.com',
      github: 'https://github.com',
    },
  },
  {
    id: 'sarfaraz-khan',
    name: 'Sarfaraz Khan',
    photoUrl: '/images/team/sarfaraz.png',
    cropPhotoUrl: '/images/team/sarfaraz-crop.webp',
    socials: {
      instagram: 'https://www.instagram.com',
      linkedin: 'https://www.linkedin.com',
      github: 'https://github.com',
    },
  },
];
