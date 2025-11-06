
'use server';

import { z } from 'zod';
import { matchResumeToJob } from '@/ai/flows/ai-match-resume-to-job';
import { getFirebaseAdmin } from '@/firebase/server-config';
import { FieldValue } from 'firebase-admin/firestore';
import { randomUUID } from 'crypto';

const ApplySchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.string().email('Invalid email address.'),
  jobId: z.string(),
  jobTitle: z.string(),
  jobDescription: z.string(),
  userId: z.string().optional(),
  resumeUrl: z.string().url('Invalid resume URL.'),
  resumeText: z.string().min(1, 'Resume content is required.'),
});

export type ApplicationState = {
  message?: string | null;
  result?: { candidateId: string; matchScore: number };
  errors?: {
    name?: string[];
    email?: string[];
    resume?: string[];
    _form?: string[];
  };
};

export async function applyForJob(
  prevState: ApplicationState,
  formData: FormData
): Promise<ApplicationState> {
  // Ensure Firebase Admin is initialized before any operation.
  try {
    getFirebaseAdmin();
  } catch (error) {
     console.error('Failed to initialize Firebase Admin:', error);
     return {
        errors: { _form: ['Server configuration error. Please contact support.'] }
     }
  }
  
  // 1. Validate form data
  const validatedFields = ApplySchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    jobId: formData.get('jobId'),
    jobTitle: formData.get('jobTitle'),
    jobDescription: formData.get('jobDescription'),
    userId: formData.get('userId'),
    resumeUrl: formData.get('resumeUrl'),
    resumeText: formData.get('resumeText'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, email, jobId, jobDescription, userId, resumeUrl, resumeText } =
    validatedFields.data;

  try {
    // 2. Perform AI Match Analysis
    const matchResult = await matchResumeToJob({
      resumeText,
      jobDescription,
    });

    // 3. Save Candidate to Firestore
    const { firestore } = getFirebaseAdmin();
    const candidateData = {
      name,
      email,
      phone: '', // Not collected in form currently
      resumeUrl,
      jobAppliedFor: jobId,
      status: 'Applied',
      appliedAt: FieldValue.serverTimestamp(),
      userId: userId || null,
      matchScore: matchResult.matchScore,
      matchReasoning: matchResult.reasoning,
      skills: [], // Skills can be extracted by another process if needed
      avatarUrl: `https://picsum.photos/seed/${randomUUID()}/100/100`,
    };

    const candidateRef = await firestore
      .collection('candidates')
      .add(candidateData);

    // 4. Return Success State
    return {
      message: 'Application submitted successfully!',
      result: {
        candidateId: candidateRef.id,
        matchScore: matchResult.matchScore,
      },
    };
  } catch (error) {
    console.error('Application Submission Error:', error);
    return {
      errors: {
        _form: ['An unexpected error occurred while submitting your application.'],
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
