
import type { LucideIcon } from 'lucide-react';
import type { Timestamp } from 'firebase/firestore';

export type Role = 'Admin' | 'HR' | 'Manager' | 'Candidate';

export type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  qualification?: string;
  avatarUrl?: string;
  role: Role;
  department?: string;
  resumeUrl?: string; 
  resumeText?: string;
};

export type HiringStage = 'Applied' | 'Shortlisted' | 'Interviewed' | 'Hired' | 'Rejected';

export type Job = {
  id?: string; // Optional because it's added after fetching
  title: string;
  department: string;
  description: string;
  requirements: string[];
  status: 'Open' | 'Closed';
  createdAt: Timestamp | string;
  postedBy: string; // User ID
};

export type Candidate = {
  name: string;
  email: string;
  phone: string;
  skills: string[];
  resumeUrl?: string; // Link to resume
  resumeText?: string; // For AI matching
  jobAppliedFor: string; // Job ID
  status: HiringStage;
  notes?: string;
  appliedAt: Timestamp | string;
  matchScore?: number;
  matchReasoning?: string;
  avatarUrl: string;
  userId: string;
};

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
};

export type WithId<T> = T & { id: string };
