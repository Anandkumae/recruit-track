
'use server';

import { z } from 'zod';
import { matchResumeToJob, type MatchResumeToJobOutput } from '@/ai/flows/ai-match-resume-to-job';
import { revalidatePath } from 'next/cache';

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

const ApplySchema = z.object({
  name: z.string().min(2, 'Name is required.'),
  email: z.string().email('Invalid email address.'),
  resume: z.string().min(50, 'Resume must be at least 50 characters.'),
  jobId: z.string(),
  jobDescription: z.string(),
});

export type ApplyState = {
    message?: string | null;
    result?: MatchResumeToJobOutput | null;
    errors?: {
        name?: string[];
        email?: string[];
        resume?: string[];
        _form?: string[];
    }
}

export async function applyForJob(
    prevState: ApplyState,
    formData: FormData
): Promise<ApplyState> {
    const validatedFields = ApplySchema.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
        resume: formData.get('resume'),
        jobId: formData.get('jobId'),
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

        // In a real app, you would now save the candidate data to your database,
        // including the name, email, applied job (jobId), and the AI match results.
        // e.g., db.candidates.create({ ...validatedFields.data, ...result });

        return {
            message: 'Application submitted successfully!',
            result,
        };
    } catch (error) {
        console.error('Application/AI Error:', error);
        return {
            errors: { _form: ['An unexpected error occurred while submitting your application.'] },
        };
    }
}
