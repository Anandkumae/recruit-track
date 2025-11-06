'use server';

import { z } from 'zod';
import { matchResumeToJob } from '@/ai/flows/ai-match-resume-to-job';
import { getFirebaseAdmin } from '@/firebase/server-config';
import { serverTimestamp } from 'firebase/firestore';

// This server action is now a pass-through.
// The primary logic is handled client-side in ApplyForm to work with browser APIs for file uploads
// and client-side Firebase SDK for auth-aware operations.
// It can be extended in the future for server-only logic if needed.

const ApplySchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.string().email('Invalid email address.'),
  jobId: z.string(),
  resumeUrl: z.string().url('A valid resume URL is required.'),
  userId: z.string(),
});


export type ApplicationState = {
  message?: string | null;
  result?: { candidateId: string };
  errors?: {
    name?: string[];
    email?: string[];
    resumeFile?: string[];
    _form?: string[];
  };
};

export async function applyForJob(
  prevState: ApplicationState,
  formData: FormData
): Promise<ApplicationState> {
  
  // The core logic (upload, AI match, Firestore write) is now on the client.
  // This server action can be used for validation or other server-side tasks in the future.
  // For now, we'll just return a success message as a placeholder.
  
  return {
    message: 'Form data received by server. Client is processing the application.',
  };
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
