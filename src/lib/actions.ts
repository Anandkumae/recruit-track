'use server';

import { z } from 'zod';
import { matchResumeToJob } from '@/ai/flows/ai-match-resume-to-job';
import { randomUUID } from 'crypto';
import { getFirebaseAdmin } from '@/firebase/server-config';
import { serverTimestamp } from 'firebase/firestore';


const ApplySchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.string().email('Invalid email address.'),
  jobId: z.string(),
  jobTitle: z.string(),
  jobDescription: z.string(),
  userId: z.string().optional(),
  resumeText: z.string().min(100, 'Resume text must be at least 100 characters.'),
});

export type ApplicationState = {
  message?: string | null;
  result?: { candidateId: string; matchScore: number };
  errors?: {
    name?: string[];
    email?: string[];
    resumeText?: string[];
    _form?: string[];
  };
};

// This server action is no longer used for Firestore writes, but kept for other potential server logic.
// The primary application logic is now client-side in ApplyForm.tsx to avoid Admin SDK issues.
export async function applyForJob(
  prevState: ApplicationState,
  formData: FormData
): Promise<ApplicationState> {
  const validatedFields = ApplySchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    jobId: formData.get('jobId'),
    jobTitle: formData.get('jobTitle'),
    jobDescription: formData.get('jobDescription'),
    userId: formData.get('userId'),
    resumeText: formData.get('resumeText'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  return { message: "This action is handled on the client." };
}


export type MatcherState = {
  message?: string | null;
  result?: { matchScore: number; reasoning: string };
  errors?: {
    resume?: string[];
    jobDescription?: string[];
    _form?: string[];
  };
};

const MatcherSchema = z.object({
  resume: z.string().min(50, 'Resume must be at least 50 characters long.'),
  jobDescription: z
    .string()
    .min(50, 'Job description must be at least 50 characters long.'),
});

export async function getMatch(prevState: MatcherState, formData: FormData) {
  const validatedFields = MatcherSchema.safeParse({
    resume: formData.get('resume'),
    jobDescription: formData.get('jobDescription'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const result = await matchResumeToJob({
      resumeText: validatedFields.data.resume,
      jobDescription: validatedFields.data.jobDescription,
    });

    return { message: 'Analysis complete', result };
  } catch (error) {
    console.error('AI Matcher Error:', error);
    return { errors: { _form: ['The AI analysis failed. Please try again.'] } };
  }
}
