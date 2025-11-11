
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
        roles: ['Admin', 'HR', 'Manager'],
    },
    {
        href: '/profile',
        label: 'My Profile',
        icon: UserIcon,
        roles: ['Admin', 'HR', 'Manager', 'Candidate'],
    },
];
