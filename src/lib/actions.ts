
'use server';

import { z } from 'zod';
import { matchResumeToJob, type MatchResumeToJobOutput } from '@/ai/flows/ai-match-resume-to-job';
import { revalidatePath } from 'next/cache';
import { getFirebaseAdmin } from '@/firebase/server-config';
import { FieldValue } from 'firebase-admin/firestore';

const MatcherSchema = z.object({
  resume: z.string().min(50, 'Resume text must be at least 50 characters long.'),
  jobDescription: z.string().min(100, 'Job description must be at least 100 characters long.'),
});

export type MatcherState = {
  message?: string | null;
  result?: MatchResumeToJobOutput | null;
  errors?: {
    resume?: string[];
    jobDescription?: string[];
    _form?: string[];
  };
};

export async function getMatch(
  prevState: MatcherState,
  formData: FormData
): Promise<MatcherState> {
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
    
    revalidatePath('/resume-matcher');
    
    return {
      message: 'Successfully analyzed resume.',
      result,
    };
  } catch (error) {
    console.error('AI Matcher Error:', error);
    return {
      errors: { _form: ['An unexpected error occurred. Please try again.'] },
    };
  }
}
