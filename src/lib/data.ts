import type { User, Job, Candidate, NavItem } from '@/lib/types';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  FileText,
  User as UserIcon,
} from 'lucide-react';

export const users: User[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@leorecruit.com',
    avatarUrl: 'https://picsum.photos/seed/user1/100/100',
    role: 'Admin',
    department: 'Executive',
  },
  {
    id: '2',
    name: 'HR Manager',
    email: 'hr@leorecruit.com',
    avatarUrl: 'https://picsum.photos/seed/user2/100/100',
    role: 'HR',
    department: 'Human Resources',
  },
  {
    id: '3',
    name: 'Engineering Manager',
    email: 'manager@leorecruit.com',
    avatarUrl: 'https://picsum.photos/seed/user3/100/100',
    role: 'Manager',
    department: 'Engineering',
  },
  {
    id: '4',
    name: 'Aspiring Candidate',
    email: 'candidate@example.com',
    avatarUrl: 'https://picsum.photos/seed/user4/100/100',
    role: 'Candidate',
  },
];

export const jobs: Job[] = [
  // This static data is no longer used for the main jobs list,
  // but can be kept for reference or fallback.
  // The app now fetches jobs directly from Firestore.
];

export const candidates: Candidate[] = [
  {
    id: 'cand-1',
    name: 'Alice Johnson',
    email: 'alice.j@example.com',
    phone: '123-456-7890',
    skills: ['React', 'TypeScript', 'Next.js', 'Node.js'],
    jobAppliedFor: 'job-1',
    status: 'Interviewed',
    appliedAt: '2024-05-22T11:00:00Z',
    matchScore: 92,
    matchReasoning: 'Excellent match. Alice has over 6 years of experience with React and TypeScript, and her recent project involved a large-scale Next.js application, which aligns perfectly with the job requirements.',
    avatarUrl: 'https://picsum.photos/seed/cand1/100/100',
    resumeText: `...Alice Johnson's Resume Text...`,
  },
  {
    id: 'cand-2',
    name: 'Bob Williams',
    email: 'bob.w@example.com',
    phone: '234-567-8901',
    skills: ['Product Strategy', 'Agile', 'JIRA', 'Market Research'],
    jobAppliedFor: 'job-2',
    status: 'Shortlisted',
    appliedAt: '2024-05-21T15:20:00Z',
    matchScore: 85,
    matchReasoning: 'Strong candidate. Bob demonstrates solid experience in product management within the SaaS industry and is well-versed in agile methodologies as required.',
    avatarUrl: 'https://picsum.photos/seed/cand2/100/100',
    resumeText: `...Bob Williams's Resume Text...`,
  },
  {
    id: 'cand-3',
    name: 'Charlie Brown',
    email: 'charlie.b@example.com',
    phone: '345-678-9012',
    skills: ['Angular', 'Vue.js', 'CSS', 'HTML'],
    jobAppliedFor: 'job-1',
    status: 'Applied',
    appliedAt: '2024-05-23T09:05:00Z',
    matchScore: 65,
    matchReasoning: 'Moderate match. While Charlie has strong frontend skills, his experience is primarily with Angular and Vue.js, not React, which is a key requirement for the role.',
    avatarUrl: 'https://picsum.photos/seed/cand3/100/100',
    resumeText: `...Charlie Brown's Resume Text...`,
  },
  {
    id: 'cand-4',
    name: 'Diana Prince',
    email: 'diana.p@example.com',
    phone: '456-789-0123',
    skills: ['Figma', 'User Research', 'Prototyping', 'Design Systems'],
    jobAppliedFor: 'job-3',
    status: 'Hired',
    appliedAt: '2024-04-28T18:00:00Z',
    matchScore: 98,
    matchReasoning: 'Exceptional match. Diana\'s portfolio is outstanding and showcases a deep understanding of user-centered design. Her proficiency in Figma and experience building design systems exceed the job requirements.',
    avatarUrl: 'https://picsum.photos/seed/cand4/100/100',
    resumeText: `...Diana Prince's Resume Text...`,
  },
];

export const navItems: NavItem[] = [
    {
        href: '/dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        roles: ['Admin', 'HR', 'Manager', 'Candidate'],
    },
    {
        href: '/jobs',
        label: 'Jobs',
        icon: Briefcase,
        roles: ['Admin', 'HR', 'Manager', 'Candidate'],
    },
    {
        href: '/candidates',
        label: 'Candidates',
        icon: Users,
        roles: ['Admin', 'HR', 'Manager'],
    },
    {
        href: '/resume-matcher',
        label: 'AI Resume Matcher',
        icon: FileText,
        roles: ['HR', 'Manager'],
    },
    {
        href: '/profile',
        label: 'My Profile',
        icon: UserIcon,
        roles: ['HR', 'Manager', 'Candidate'],
    },
];
