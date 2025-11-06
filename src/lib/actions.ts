'use server';

import { z } from 'zod';
import { matchResumeToJob } from '@/ai/flows/ai-match-resume-to-job';
import { getFirebaseAdmin } from '@/firebase/server-config';
import { serverTimestamp } from 'firebase/firestore';

const ApplySchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.string().email('Invalid email address.'),
  jobId: z.string(),
  userId: z.string(),
  resumeText: z.string().min(50, 'Resume text is required.'),
  jobDescription: z.string(), // Added for AI call
});


export type ApplicationState = {
  message?: string | null;
  result?: { candidateId: string };
  errors?: {
    name?: string[];
    email?: string[];
    resumeText?: string[];
    _form?: string[];
  };
};

export async function applyForJob(
  prevState: ApplicationState,
  formData: FormData
): Promise<ApplicationState> {
  const { firestore } = getFirebaseAdmin();
  
  const validatedFields = ApplySchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    jobId: formData.get('jobId'),
    userId: formData.get('userId'),
    resumeText: formData.get('resumeText'),
    // We need to fetch the job description on the server to pass to the AI
    jobDescription: (await firestore.collection('jobs').doc(formData.get('jobId') as string).get()).data()?.description || '',
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, email, jobId, userId, resumeText, jobDescription } = validatedFields.data;

  try {
    const matchResult = await matchResumeToJob({
      resumeText,
      jobDescription,
    });

    const candidateData = {
      name,
      email,
      phone: '', // Not collected in this form
      resumeText,
      jobAppliedFor: jobId,
      status: 'Applied' as const,
      appliedAt: serverTimestamp(),
      userId,
      matchScore: matchResult.matchScore,
      matchReasoning: matchResult.reasoning,
      skills: [], // Could be extracted by AI in the future
      avatarUrl: `https://picsum.photos/seed/${userId}/100/100`,
      resumeUrl: '', // No file upload
    };

    const docRef = await firestore.collection('candidates').add(candidateData);

    return {
      message: 'Application submitted successfully!',
      result: { candidateId: docRef.id },
    };

  } catch (error) {
    console.error('Submission Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { errors: { _form: ['An unexpected error occurred while submitting your application. Please try again. Details: ' + errorMessage] }};
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
