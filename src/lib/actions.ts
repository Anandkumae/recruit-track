'use server';

import { z } from 'zod';
import { matchResumeToJob } from '@/ai/flows/ai-match-resume-to-job';
import { randomUUID } from 'crypto';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { firebaseConfig } from '@/firebase/config';

// Use a separate app instance for server-side actions to avoid conflicts.
// The `name` makes it a singleton.
const serverActionApp = !getApps().find(app => app.name === 'serverActionApp')
  ? initializeApp(firebaseConfig, 'serverActionApp')
  : getApp('serverActionApp');

const firestore = getFirestore(serverActionApp);

const ApplySchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.string().email('Invalid email address.'),
  jobId: z.string(),
  jobTitle: z.string(),
  jobDescription: z.string(),
  userId: z.string().optional(),
  resumeUrl: z.string().min(1, 'Resume is required.'), // We now expect a URL
  resumeFileText: z.string().min(1, 'Resume content is missing.'), // Text content for AI
});

export type ApplicationState = {
  message?: string | null;
  result?: { candidateId: string; matchScore: number };
  errors?: {
    name?: string[];
    email?: string[];
    resumeUrl?: string[];
    resumeFileText?: string[];
    _form?: string[];
  };
};

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
    resumeUrl: formData.get('resumeUrl'),
    resumeFileText: formData.get('resumeFileText'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, email, jobId, jobDescription, userId, resumeUrl, resumeFileText } =
    validatedFields.data;

  try {
    // File is already uploaded by the client. Now we just process the data.

    // 1. Perform AI Match Analysis
    const matchResult = await matchResumeToJob({
      resumeText: resumeFileText,
      jobDescription,
    });

    // 2. Save Candidate to Firestore
    const candidateData = {
      name,
      email,
      phone: '', // Not collected in form currently
      resumeUrl: resumeUrl, // The URL from the client-side upload
      jobAppliedFor: jobId,
      status: 'Applied',
      appliedAt: serverTimestamp(),
      userId: userId || null,
      matchScore: matchResult.matchScore,
      matchReasoning: matchResult.reasoning,
      skills: [],
      avatarUrl: `https://picsum.photos/seed/${randomUUID()}/100/100`,
    };

    const docRef = await addDoc(collection(firestore, "candidates"), candidateData);

    // 3. Return Success State
    return {
      message: 'Application submitted successfully!',
      result: {
        candidateId: docRef.id,
        matchScore: matchResult.matchScore,
      },
    };
  } catch (error) {
    console.error('Application Submission Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return {
      errors: {
        _form: ['An unexpected error occurred while submitting your application. Please try again. Details: ' + errorMessage],
      },
    };
  }
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
