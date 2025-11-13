
'use server';

import { z } from 'zod';
import { matchResumeToJob } from '@/ai/flows/ai-match-resume-to-job';
import { getFirestoreAdmin } from '@/firebase/server-config';
import { FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import type { Job, User, Interview, Candidate, HiringStage } from '@/lib/types';
import { Readable } from 'stream';

// Helper to convert a file to a Base64 Data URI
async function fileToDataURI(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString('base64');
  return `data:${file.type};base64,${base64}`;
}

const ApplySchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.string().email('Invalid email address.'),
  phone: z.string().min(1, 'Phone number is required.'),
  jobId: z.string(),
  userId: z.string().min(1, 'User ID is required.'),
  resumeText: z.string().optional(),
  resumeUrl: z.string().optional(),
  avatarUrl: z.string().optional(),
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

  const { jobId, userId } = prevState;
  
  const validatedFields = ApplySchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    jobId: jobId,
    userId: userId,
    resumeText: formData.get('resumeText'),
    resumeUrl: formData.get('resumeUrl'),
    avatarUrl: formData.get('avatarUrl'),
  });
  
  if (!validatedFields.success) {
    return {
      ...prevState,
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, email, phone, resumeText, resumeUrl, avatarUrl } = validatedFields.data;

  try {
    const firestore = getFirestoreAdmin();
    const jobDoc = await firestore.collection('jobs').doc(jobId).get();
    if (!jobDoc.exists) {
        return { ...prevState, errors: { _form: ['The job you are applying for no longer exists.'] } };
    }
    const jobData = jobDoc.data() as Job;
    const jobDescription = jobData?.description || '';

    // Update user's contact information
    const userDocRef = firestore.collection('users').doc(userId);
    await userDocRef.set({ phone }, { merge: true });

    let matchResult = { matchScore: 0, reasoning: 'AI analysis could not be performed.' };
    
    // We will use resumeText if available for AI matching
    const resumeContent = resumeText; 

    if (
      resumeContent &&
      resumeContent.length > 10 &&
      jobDescription.length > 10
    ) {
        // Since resumeText is just text, we need to wrap it in a format the AI flow expects.
        // The flow expects a data URI, so we'll base64 encode the text.
        try {
            const result = await matchResumeToJob({
                jobDescription,
                photoDataUri: `data:text/plain;base64,${Buffer.from(resumeContent).toString('base64')}`
            });
            if (result) {
                matchResult = result;
            }
        } catch (aiError) {
            console.error('AI Matching Error:', aiError);
            // Don't block application if AI fails, just use default score.
            matchResult.reasoning = 'AI analysis failed. Please try again later.';
        }
    } else {
        matchResult.reasoning = 'Not enough information in resume or job description for AI analysis.';
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
      skills: [], // Default to empty array, can be populated later
      avatarUrl: avatarUrl || `https://picsum.photos/seed/${userId}/100/100`, // Placeholder image
      resumeText: resumeText || '',
      resumeUrl: resumeUrl || '',
    };

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
    resumeFile?: string[];
    jobDescription?: string[];
    _form?: string[];
  };
};

const MatcherSchema = z.object({
  jobDescription: z.string().min(10, 'Job description must be at least 10 characters long.'),
  resumeFile: z
    .instanceof(File, { message: 'Please upload a resume file.' })
    .refine((file) => file.size > 0, 'The resume file cannot be empty.')
    .refine((file) => file.size < 5 * 1024 * 1024, 'File size must be less than 5MB.')
});

export async function getMatch(prevState: MatcherState, formData: FormData): Promise<MatcherState> {
  const validatedFields = MatcherSchema.safeParse({
    jobDescription: formData.get('jobDescription'),
    resumeFile: formData.get('resumeFile'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  const { jobDescription, resumeFile } = validatedFields.data;
  
  try {
    const photoDataUri = await fileToDataURI(resumeFile);
    
    const result = await matchResumeToJob({
      jobDescription,
      photoDataUri,
    });

    if (!result) {
        return { errors: { _form: ['AI analysis returned no result.'] } };
    }

    return { message: 'Analysis complete', result };
  } catch (error) {
    console.error('AI Matcher Error:', error);
    return { errors: { _form: ['The AI analysis failed. This could be due to an unsupported file type or a problem with the AI service.'] } };
  }
}

/**
 * Server action designed to be called securely by a Genkit tool.
 * It fetches the resume text for a given candidate.
 */
export async function getCandidateResumeTextAction(candidateId: string): Promise<{ resumeText?: string; error?: string; }> {
    try {
        const firestore = getFirestoreAdmin();
        const doc = await firestore.collection('candidates').doc(candidateId).get();

        if (!doc.exists) {
            return { error: `Candidate with ID '${candidateId}' not found.` };
        }

        const candidateData = doc.data() as Candidate;

        // Check for resumeText field specifically
        if (!candidateData.resumeText) {
            return { error: `Candidate with ID '${candidateId}' has no resume text.` };
        }

        return { resumeText: candidateData.resumeText };

    } catch (error) {
        console.error("Server Action 'getCandidateResumeText' failed:", error);
        // It's better to return a generic error to the client/tool
        return { error: 'Failed to retrieve candidate data due to a database error.' };
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
    const firestore = getFirestoreAdmin();
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


const RerunAiMatchSchema = z.object({
  candidateId: z.string().min(1, 'Candidate ID is required'),
});

export type RerunAiMatchState = {
  success?: boolean;
  message?: string;
  errors?: {
    _form?: string[];
  };
};

export async function rerunAiMatch(
  prevState: RerunAiMatchState,
  formData: FormData
): Promise<RerunAiMatchState> {
  const validatedFields = RerunAiMatchSchema.safeParse({
    candidateId: formData.get('candidateId'),
  });

  if (!validatedFields.success) {
    return { errors: { _form: ['Invalid candidate ID.'] } };
  }
  
  const { candidateId } = validatedFields.data;

  try {
    const firestore = getFirestoreAdmin();
    const candidateRef = firestore.collection('candidates').doc(candidateId);
    const candidateDoc = await candidateRef.get();

    if (!candidateDoc.exists) {
      return { errors: { _form: ['Candidate not found.'] } };
    }
    
    const candidate = candidateDoc.data() as Candidate;
    
    const jobRef = firestore.collection('jobs').doc(candidate.jobAppliedFor);
    const jobDoc = await jobRef.get();
    
    if (!jobDoc.exists) {
      return { errors: { _form: ['Associated job not found.'] } };
    }
    
    const job = jobDoc.data() as Job;

    const resumeContent = candidate.resumeText;
    const jobDescription = job.description;

    if (!resumeContent || resumeContent.length < 10 || !jobDescription || jobDescription.length < 10) {
      return { errors: { _form: ['Not enough resume or job description text to perform analysis.'] } };
    }
    
    const result = await matchResumeToJob({
      jobDescription,
      photoDataUri: `data:image/png;base64,${Buffer.from(resumeContent).toString('base64')}`
    });
    
    if(!result) {
        return { errors: { _form: ['AI analysis returned no result.'] } };
    }
    
    await candidateRef.update({
      matchScore: result.matchScore,
      matchReasoning: result.reasoning,
    });
    
    revalidatePath(`/candidates/${candidateId}`);
    return { success: true, message: 'AI analysis has been updated.' };

  } catch (error) {
    console.error('AI Re-match Error:', error);
    return { errors: { _form: ['An unexpected error occurred while re-running the analysis.'] } };
  }
}

const UpdateCandidateStatusSchema = z.object({
  candidateId: z.string().min(1, 'Candidate ID is required.'),
  status: z.enum(['Applied', 'Shortlisted', 'Interviewed', 'Hired', 'Rejected']),
});

export type UpdateCandidateStatusState = {
  success?: boolean;
  message?: string;
  errors?: {
    _form?: string[];
  };
};

export async function updateCandidateStatus(
  prevState: UpdateCandidateStatusState,
  formData: FormData
): Promise<UpdateCandidateStatusState> {
  const validatedFields = UpdateCandidateStatusSchema.safeParse({
    candidateId: formData.get('candidateId'),
    status: formData.get('status'),
  });

  if (!validatedFields.success) {
    return { errors: { _form: ['Invalid data provided.'] } };
  }

  const { candidateId, status } = validatedFields.data;

  try {
    const firestore = getFirestoreAdmin();
    const candidateRef = firestore.collection('candidates').doc(candidateId);
    const candidateDoc = await candidateRef.get();

    if (!candidateDoc.exists) {
      return { errors: { _form: ['Candidate not found.'] } };
    }

    await candidateRef.update({ status: status });

    revalidatePath('/dashboard');
    revalidatePath('/candidates');
    revalidatePath(`/candidates/${candidateId}`);

    return { success: true, message: `Candidate has been ${status.toLowerCase()}.` };
  } catch (error) {
    console.error('Update Candidate Status Error:', error);
    return { errors: { _form: ['Failed to update candidate status.'] } };
  }
}
