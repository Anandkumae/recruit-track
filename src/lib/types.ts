
import type { LucideIcon } from 'lucide-react';
import type { Timestamp } from 'firebase/firestore';

export type Role = 'Admin' | 'HR' | 'Manager' | 'Candidate';

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string; // Made required
  qualification?: string;
  avatarUrl?: string;
  role: Role;
  department?: string;
  resumeUrl?: string; 
  resumeText?: string;
  skills?: string[];
  // Company information (for employers/admins only)
  companyName?: string;
  companyDescription?: string;
  companyWebsite?: string;
  companySize?: string;
};

export type HiringStage = 'Applied' | 'Shortlisted' | 'Interview Scheduled' | 'Interviewed' | 'Hired' | 'Rejected';

export type JobCategory = 'Commissioning Engineer' | 'Service Engineer' | 'Project Engineer' | 'Technician';

export type Job = {
  id?: string; // Optional because it's added after fetching
  title: string;
  department: string;
  jobCategory: JobCategory; // Required mechanical engineering category
  description: string;
  requirements: string[];
  status: 'Open' | 'Closed';
  createdAt: Timestamp | string;
  postedBy: string; // User ID
};

export type Candidate = {
  id: string;
  name: string;
  email: string;
  phone: string; // Made required
  skills: string[];
  resumeUrl?: string; // Link to resume
  resumeText?: string; // For AI matching
  applicationDescription: string; // Required: Employee's job description/cover letter
  requiredTimePeriod?: string; // Optional: Notice period or availability
  jobAppliedFor: string; // Job ID
  status: HiringStage;
  notes?: string;
  appliedAt: Timestamp | string;
  matchScore?: number;
  matchReasoning?: string;
  avatarUrl: string;
  userId: string;
  employerId?: string;
};

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
};

export type WithId<T> = T & { id: string };

export interface Interview {
    id: string;
    candidateId: string;
    candidateName: string;
    candidateEmail: string;
    jobId: string;
    jobTitle: string;
    scheduledAt: string; // ISO 8601 string
    scheduledBy: string; // User ID
    scheduledByName?: string;
    location?: string;
    meetingLink?: string;
    notes?: string;
    status: 'Scheduled' | 'Completed' | 'Cancelled' | 'Rescheduled';
    createdAt: string; // ISO 8601 string
}
