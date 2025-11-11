'use server';

import { z } from 'zod';
import { matchResumeToJob } from '@/ai/flows/ai-match-resume-to-job';
import { getFirebaseAdmin } from '@/firebase/server-config';
import { FieldValue } from 'firebase-admin/firestore';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

const ApplySchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.string().email('Invalid email address.'),
  jobId: z.string(),
  userId: z.string().min(1, 'User ID is required.'),
  resumeText: z.string().min(50, 'Resume text must be at least 50 characters.'),
});

export type ApplicationState = {
  message?: string | null;
  result?: { candidateId: string };
  errors?: {
    name?: string[];
    email?: string[];
    resumeText?: string[];
    userId?: string[];
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
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, email, jobId, userId, resumeText } = validatedFields.data;

  try {
    const jobDoc = await firestore.collection('jobs').doc(jobId).get();
    if (!jobDoc.exists) {
        return { errors: { _form: ['The job you are applying for no longer exists.'] } };
    }
    const jobDescription = jobDoc.data()?.description || '';

    // Update the user's profile with the new resume text
    // This makes it available for future applications
    const userDocRef = firestore.collection('users').doc(userId);
    await userDocRef.update({ resumeText: resumeText });


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
      appliedAt: FieldValue.serverTimestamp(),
      userId,
      matchScore: matchResult.matchScore,
      matchReasoning: matchResult.reasoning,
      skills: [], // Could be extracted by AI in the future
      avatarUrl: `https://picsum.photos/seed/${userId}/100/100`,
    };

    const docRef = await firestore.collection('candidates').add(candidateData);
    
    // Revalidate paths to show new data and redirect
    revalidatePath('/candidates');
    revalidatePath('/dashboard');

  } catch (error) {
    console.error('Submission Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { errors: { _form: ['An unexpected error occurred while submitting your application. Please try again.'] }};
  }
  
  // Redirect to dashboard on success
  redirect('/dashboard');
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


const CreateJobSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters."),
    department: z.string().min(2, "Department is required."),
    description: z.string().min(50, "Description must be at least 50 characters."),
    requirements: z.string().min(1, "At least one requirement is needed."),
    postedBy: z.string().min(1, "User ID is required."),
});

export type CreateJobState = {
    message?: string | null;
    errors?: {
        title?: string[];
        department?: string[];
        description?: string[];
        requirements?: string[];
        _form?: string[];
    };
};

export async function createJob(prevState: CreateJobState, formData: FormData): Promise<CreateJobState> {
   // This server action is no longer used for database operations
   // but we keep the validation logic as a reference or for future server-side checks.
    const validatedFields = CreateJobSchema.safeParse({
        title: formData.get('title'),
        department: formData.get('department'),
        description: formData.get('description'),
        requirements: formData.get('requirements'),
        postedBy: formData.get('postedBy'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }
    
    // In the new flow, the client handles the Firestore write.
    // This action will now just revalidate and redirect.
    revalidatePath('/jobs');
    redirect('/jobs');
}
