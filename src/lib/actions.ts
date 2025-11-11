
'use server';

import { z } from 'zod';
import { matchResumeToJob } from '@/ai/flows/ai-match-resume-to-job';
import { getFirebaseAdmin } from '@/firebase/server-config';
import { FieldValue } from 'firebase-admin/firestore';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import type { Job } from '@/lib/types';

const ApplySchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.string().email('Invalid email address.'),
  phone: z.string().min(1, 'Phone number is required.'),
  jobId: z.string(),
  userId: z.string().min(1, 'User ID is required.'),
  resumeText: z.string().min(50, 'Resume text must be at least 50 characters.'),
});

export type ApplicationState = {
  jobId: string;
  userId: string;
  success?: boolean;
  errors?: {
    name?: string[];
    email?: string[];
    phone?: string[];
    resumeText?: string[];
    _form?: string[];
  };
};

export async function applyForJob(
  prevState: ApplicationState,
  formData: FormData
): Promise<ApplicationState> {
  const { firestore } = getFirebaseAdmin();
  const { jobId, userId } = prevState;
  
  const validatedFields = ApplySchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    jobId: jobId,
    userId: userId,
    resumeText: formData.get('resumeText'),
  });
  
  if (!validatedFields.success) {
    return {
      ...prevState,
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, email, phone, resumeText } = validatedFields.data;

  try {
    const jobDoc = await firestore.collection('jobs').doc(jobId).get();
    if (!jobDoc.exists) {
        return { ...prevState, errors: { _form: ['The job you are applying for no longer exists.'] } };
    }
    const jobData = jobDoc.data() as Job;
    const jobDescription = jobData?.description || '';

    // Update the user's profile with the new resume text and phone
    const userDocRef = firestore.collection('users').doc(userId);
    await userDocRef.set({ resumeText: resumeText, phone: phone }, { merge: true });

    // Optional: Only run AI match if resume text or job description is substantial
    let matchResult = { matchScore: 0, reasoning: 'Not enough information to generate a score.' };
    if (resumeText.length > 100 && jobDescription.length > 100) {
        matchResult = await matchResumeToJob({
            resumeText,
            jobDescription,
        });
    }

    const candidateData = {
      name,
      email,
      phone,
      resumeText,
      jobAppliedFor: jobId,
      status: 'Applied' as const,
      appliedAt: FieldValue.serverTimestamp(),
      userId,
      matchScore: matchResult.matchScore,
      matchReasoning: matchResult.reasoning,
      skills: [], // Could be extracted by AI in the future
      avatarUrl: `https://picsum.photos/seed/${userId}/100/100`,
    };

    await firestore.collection('candidates').add(candidateData);
    
    // Revalidate paths to show new data
    revalidatePath('/candidates');
    revalidatePath('/dashboard');

  } catch (error) {
    console.error('Submission Error:', error);
    return { ...prevState, errors: { _form: ['An unexpected error occurred. Please try again.'] }};
  }
  
  // This will trigger a redirect on the client-side
  return { ...prevState, success: true, errors: {} };
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
