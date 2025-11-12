
'use server';

import { z } from 'zod';
import { matchResumeToJob } from '@/ai/flows/ai-match-resume-to-job';
import { getFirebaseAdmin } from '@/firebase/server-config';
import { FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import type { Job, User, Interview, Candidate } from '@/lib/types';

const ApplySchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.string().email('Invalid email address.'),
  phone: z.string().min(1, 'Phone number is required.'),
  jobId: z.string(),
  userId: z.string().min(1, 'User ID is required.'),
});

export type ApplicationState = {
  jobId: string;
  userId: string;
  success?: boolean;
  errors?: {
    name?: string[];
    email?: string[];
    phone?: string[];
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
  });
  
  if (!validatedFields.success) {
    return {
      ...prevState,
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, email, phone } = validatedFields.data;

  try {
    const jobDoc = await firestore.collection('jobs').doc(jobId).get();
    if (!jobDoc.exists) {
        return { ...prevState, errors: { _form: ['The job you are applying for no longer exists.'] } };
    }
    const jobData = jobDoc.data() as Job;
    const jobDescription = jobData?.description || '';

    // Fetch the user's profile to reuse their stored resume and ensure details are current
    const userDocRef = firestore.collection('users').doc(userId);
    const userDocSnapshot = await userDocRef.get();
    const userData = userDocSnapshot.data() as Partial<User> | undefined;
    const resumeTextFromProfile =
      typeof userData?.resumeText === 'string' ? userData.resumeText : '';
    const resumeUrlFromProfile =
      typeof userData?.resumeUrl === 'string' ? userData.resumeUrl : undefined;

    // Update contact information if it has changed
    await userDocRef.set({ phone }, { merge: true });

    let matchResult = { matchScore: 0, reasoning: 'AI analysis not performed.' };
    if (
      resumeTextFromProfile &&
      resumeTextFromProfile.length > 100 &&
      jobDescription.length > 100
    ) {
        matchResult = await matchResumeToJob({
            resumeText: resumeTextFromProfile,
            jobDescription,
        });
    }

    const candidateData: Record<string, unknown> = {
      name,
      email,
      phone,
      jobAppliedFor: jobId,
      status: 'Applied' as const,
      appliedAt: FieldValue.serverTimestamp(),
      userId,
      matchScore: matchResult.matchScore,
      matchReasoning: matchResult.reasoning,
      skills: [], 
      avatarUrl: `https://picsum.photos/seed/${userId}/100/100`,
    };

    if (resumeTextFromProfile) {
      candidateData.resumeText = resumeTextFromProfile;
    }

    if (resumeUrlFromProfile) {
      candidateData.resumeUrl = resumeUrlFromProfile;
    }

    await firestore.collection('candidates').add(candidateData);
    
    revalidatePath('/candidates');
    revalidatePath('/dashboard');
    revalidatePath(`/jobs/${jobId}`);

  } catch (error) {
    console.error('Submission Error:', error);
    return { ...prevState, errors: { _form: ['An unexpected error occurred. Please try again.'] }};
  }
  
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

const ScheduleInterviewSchema = z.object({
  candidateId: z.string().min(1, 'Candidate ID is required.'),
  scheduledAt: z.string().min(1, 'Interview date and time is required.'),
  location: z.string().optional(),
  meetingLink: z.string().url('Invalid meeting link URL.').optional().or(z.literal('')),
  notes: z.string().optional(),
  scheduledBy: z.string().min(1, 'Scheduler user ID is required.'),
  scheduledByName: z.string().optional(),
});

export type ScheduleInterviewState = {
  candidateId: string;
  success?: boolean;
  errors?: {
    candidateId?: string[];
    scheduledAt?: string[];
    location?: string[];
    meetingLink?: string[];
    notes?: string[];
    scheduledBy?: string[];
    _form?: string[];
  };
};

export async function scheduleInterview(
  prevState: ScheduleInterviewState,
  formData: FormData
): Promise<ScheduleInterviewState> {
  const { firestore } = getFirebaseAdmin();
  const { candidateId } = prevState;
  
  const validatedFields = ScheduleInterviewSchema.safeParse({
    candidateId: formData.get('candidateId') || candidateId,
    scheduledAt: formData.get('scheduledAt'),
    location: formData.get('location'),
    meetingLink: formData.get('meetingLink'),
    notes: formData.get('notes'),
    scheduledBy: formData.get('scheduledBy'),
    scheduledByName: formData.get('scheduledByName'),
  });
  
  if (!validatedFields.success) {
    return {
      ...prevState,
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { scheduledAt, location, meetingLink, notes, scheduledBy, scheduledByName } = validatedFields.data;

  try {
    // Fetch candidate data
    const candidateDoc = await firestore.collection('candidates').doc(candidateId).get();
    if (!candidateDoc.exists) {
      return { ...prevState, errors: { _form: ['Candidate not found.'] } };
    }
    const candidateData = candidateDoc.data() as Candidate;
    
    // Fetch job data
    const jobDoc = await firestore.collection('jobs').doc(candidateData.jobAppliedFor).get();
    if (!jobDoc.exists) {
      return { ...prevState, errors: { _form: ['Job not found.'] } };
    }
    const jobData = jobDoc.data() as Job;
    
    // Parse scheduled date
    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      return { ...prevState, errors: { scheduledAt: ['Invalid date format.'] } };
    }

    // Create interview document
    const interviewData: Omit<Interview, 'id'> = {
      candidateId,
      candidateName: candidateData.name,
      candidateEmail: candidateData.email,
      jobId: candidateData.jobAppliedFor,
      jobTitle: jobData.title,
      scheduledAt: scheduledDate.toISOString(),
      scheduledBy,
      scheduledByName: scheduledByName || undefined,
      location: location || undefined,
      meetingLink: meetingLink || undefined,
      notes: notes || undefined,
      status: 'Scheduled',
      createdAt: new Date().toISOString(),
    };

    await firestore.collection('interviews').add(interviewData);
    
    // Update candidate status to 'Interviewed' if not already
    if (candidateData.status !== 'Interviewed' && candidateData.status !== 'Hired') {
      await firestore.collection('candidates').doc(candidateId).update({
        status: 'Interviewed',
      });
    }
    
    revalidatePath('/candidates');
    revalidatePath(`/candidates/${candidateId}`);
    revalidatePath('/dashboard');

  } catch (error) {
    console.error('Schedule Interview Error:', error);
    return { ...prevState, errors: { _form: ['An unexpected error occurred. Please try again.'] } };
  }
  
  return { ...prevState, success: true, errors: {} };
}
