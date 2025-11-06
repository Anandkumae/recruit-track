import type { LucideIcon } from 'lucide-react';

export type Role = 'Admin' | 'HR' | 'Manager' | 'Candidate';

export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: Role;
  department?: string;
  resumeUrl?: string; // Added field for resume URL
};

export type HiringStage = 'Applied' | 'Shortlisted' | 'Interviewed' | 'Hired' | 'Rejected';

export type Job = {
  id: string;
  title: string;
  department: string;
  description: string;
  requirements: string[];
  status: 'Open' | 'Closed';
  postedAt: string;
  postedBy: string; // User ID
};

export type Candidate = {
  id:string;
  name: string;
  email: string;
  phone: string;
  skills: string[];
  resumeUrl?: string; // Link to resume
  resumeText?: string; // For AI matching
  jobAppliedFor: string; // Job ID
  status: HiringStage;
  notes?: string;
  appliedAt: string;
  matchScore?: number;
  matchReasoning?: string;
  avatarUrl: string;
};

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
};
