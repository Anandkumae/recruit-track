'use server';

import { z } from 'zod';
import { matchResumeToJob } from '@/ai/flows/ai-match-resume-to-job';
import { generateInterviewQuestions } from '@/ai/flows/generate-interview-questions';
import { parseResume } from '@/ai/flows/parse-resume';
import { revalidatePath } from 'next/cache';
import type { Job, User, Interview, Candidate, HiringStage } from '@/lib/types';
import { getFirebaseAdmin } from '@/utils/getFirebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { logActivity } from './activity-logger';

type FileLike = Blob & { name?: string };

const isFileLike = (value: unknown): value is FileLike => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<FileLike>;
  return (
    typeof candidate.size === 'number' &&
    typeof candidate.type === 'string' &&
    typeof (candidate as Blob).arrayBuffer === 'function'
  );
};

// Helper to convert a file to a Base64 Data URI
async function fileToDataURI(file: FileLike): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString('base64');
  const mimeType = file.type || 'application/octet-stream';
  return `data:${mimeType};base64,${base64}`;
}

const ApplySchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.string().email('Invalid email address.'),
  phone: z.string().min(1, 'Phone number is required.'),
  applicationDescription: z.string().min(20, 'Please provide at least 20 characters describing why you are a good fit.'),
  requiredTimePeriod: z.string().optional(),
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
    applicationDescription?: string[];
    requiredTimePeriod?: string[];
    _form?: string[];
  };
};

export async function applyForJob(
  prevState: ApplicationState,
  formData: FormData
): Promise<ApplicationState> {
  const { jobId, userId } = prevState;
  console.log('[applyForJob] Starting application submission', { jobId, userId });
  
  let db;
  try {
    const firebaseAdmin = await getFirebaseAdmin();
    db = firebaseAdmin.db;
    console.log('[applyForJob] Firebase Admin initialized successfully');
  } catch (initError) {
    console.error('[applyForJob] Firebase Admin initialization failed:', initError);
    return { 
      ...prevState, 
      errors: { _form: ['Server configuration error. Please contact support.'] } 
    };
  }
  
  const validatedFields = ApplySchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    applicationDescription: formData.get('applicationDescription'),
    requiredTimePeriod: formData.get('requiredTimePeriod'),
    jobId: jobId,
    userId: userId,
    resumeText: formData.get('resumeText'),
    resumeUrl: formData.get('resumeUrl'),
    avatarUrl: formData.get('avatarUrl'),
  });
  
  if (!validatedFields.success) {
    console.log('[applyForJob] Validation failed:', validatedFields.error);
    return {
      ...prevState,
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, email, phone, applicationDescription, requiredTimePeriod, resumeText, resumeUrl, avatarUrl } = validatedFields.data;
  console.log('[applyForJob] Validation successful, proceeding with submission');

  try {
    const jobDoc = await db.collection('jobs').doc(jobId).get();
    if (!jobDoc.exists) {
        return { ...prevState, errors: { _form: ['The job you are applying for no longer exists.'] } };
    }
    const jobData = jobDoc.data() as Job;
    const jobDescription = jobData?.description || '';

    // Update user's contact information
    const userDocRef = db.collection('users').doc(userId);
    await userDocRef.set({ phone }, { merge: true });

    let matchResult = { matchScore: 0, reasoning: 'Application submitted successfully.', suggestedSkills: [] as string[] };
    
    // AI matching is currently disabled to ensure fast application submission
    // Can be re-enabled in the future by uncommenting the code below
    /*
    const resumeContent = resumeText; 
    if (resumeContent && resumeContent.length > 10 && jobDescription.length > 10) {
        try {
            const result = await Promise.race([
                matchResumeToJob({
                    jobDescription,
                    photoDataUri: `data:text/plain;base64,${Buffer.from(resumeContent).toString('base64')}`
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('AI matching timeout')), 5000))
            ]);
            if (result) {
                matchResult = result as typeof matchResult;
            }
        } catch (aiError) {
            console.error('AI Matching Error:', aiError);
            matchResult.reasoning = 'AI analysis skipped.';
        }
    }
    */

    const candidateData: Record<string, unknown> = {
      name,
      email,
      phone,
      applicationDescription,
      ...(requiredTimePeriod && { requiredTimePeriod }),
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
      employerId: jobData.postedBy,
    };

    await db.collection('candidates').add(candidateData);
    
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
  result?: { matchScore: number; reasoning: string; suggestedSkills: string[] };
  errors?: {
    resumeFile?: string[];
    jobDescription?: string[];
    _form?: string[];
  };
};

const MatcherSchema = z.object({
  jobDescription: z.string().min(10, 'Job description must be at least 10 characters long.'),
  resumeFile: z
    .custom<FileLike>((file) => isFileLike(file), {
      message: 'Please upload a resume file.',
    })
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
    const { db } = await getFirebaseAdmin();
    try {
        const doc = await db.collection('candidates').doc(candidateId).get();

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
  const { db } = await getFirebaseAdmin();
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
    const candidateDoc = await db.collection('candidates').doc(candidateId).get();
    if (!candidateDoc.exists) {
      return { ...prevState, errors: { _form: ['Candidate not found.'] } };
    }
    const candidateData = candidateDoc.data() as Candidate;
    
    // Fetch job data
    const jobDoc = await db.collection('jobs').doc(candidateData.jobAppliedFor).get();
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
      status: 'Scheduled',
      createdAt: new Date().toISOString(),
      ...(location && { location }),
      ...(meetingLink && { meetingLink }),
      ...(notes && { notes }),
    };

    await db.collection('interviews').add(interviewData);
    
    // Update candidate status to 'Interviewed' if not already
    if (candidateData.status !== 'Interviewed' && candidateData.status !== 'Hired') {
      await db.collection('candidates').doc(candidateId).update({
        status: 'Interviewed',
      });
      
      // Log the interview scheduling activity
      await logActivity(
        'interview_scheduled',
        candidateId,
        candidateData.name,
        candidateData.jobAppliedFor,
        jobData.title,
        scheduledBy,
        scheduledByName || 'Admin',
        {
          scheduledAt: scheduledDate,
          location: location || undefined,
          meetingLink: meetingLink || undefined,
          notes: notes || undefined
        },
        candidateData.userId
      );
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

import * as fs from 'fs';
import * as path from 'path';

export async function rerunAiMatch(
  prevState: RerunAiMatchState,
  formData: FormData
): Promise<RerunAiMatchState> {
  const { db } = await getFirebaseAdmin();
  const validatedFields = RerunAiMatchSchema.safeParse({
    candidateId: formData.get('candidateId'),
  });

  if (!validatedFields.success) {
    return { errors: { _form: ['Invalid candidate ID.'] } };
  }
  
  const { candidateId } = validatedFields.data;

  try {
    const candidateRef = db.collection('candidates').doc(candidateId);
    const candidateDoc = await candidateRef.get();

    if (!candidateDoc.exists) {
      return { errors: { _form: ['Candidate not found.'] } };
    }
    
    const candidate = candidateDoc.data() as Candidate;
    
    const jobRef = db.collection('jobs').doc(candidate.jobAppliedFor);
    const jobDoc = await jobRef.get();
    
    if (!jobDoc.exists) {
      return { errors: { _form: ['Associated job not found.'] } };
    }
    
    const job = jobDoc.data() as Job;
    const jobDescription = job.description;

    if (!jobDescription || jobDescription.length < 10) {
        return { errors: { _form: ['Job description is too short for analysis.'] } };
    }

    let photoDataUri: string | null = null;

    // 1. Try to use existing resumeText
    if (candidate.resumeText && candidate.resumeText.length >= 10) {
        // Use text/plain for text content
        photoDataUri = `data:text/plain;base64,${Buffer.from(candidate.resumeText).toString('base64')}`;
    } 
    // 2. Fallback: Try to fetch from resumeUrl
    else if (candidate.resumeUrl) {
        try {
            let fetchUrl = candidate.resumeUrl;
            
            // Check if it's a relative path (storage path)
            if (!candidate.resumeUrl.startsWith('http')) {
                const { storage } = await getFirebaseAdmin();
                const bucket = storage.bucket();
                const file = bucket.file(candidate.resumeUrl);
                
                const [signedUrl] = await file.getSignedUrl({
                    action: 'read',
                    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
                });
                
                fetchUrl = signedUrl;
            }

            const response = await fetch(fetchUrl);
            
            if (response.ok) {
                const arrayBuffer = await response.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                const base64 = buffer.toString('base64');
                const mimeType = response.headers.get('content-type') || 'application/pdf';
                photoDataUri = `data:${mimeType};base64,${base64}`;
            } else {
                console.warn(`Failed to fetch resume from URL: ${fetchUrl} - Status: ${response.status}`);
            }
        } catch (fetchError) {
            console.error(`Error fetching resume file: ${fetchError}`);
        }
    }

    if (!photoDataUri) {
      return { errors: { _form: ['Not enough resume text found and failed to retrieve resume file for analysis.'] } };
    }
    
    const result = await matchResumeToJob({
      jobDescription,
      photoDataUri,
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
    console.error(`Unexpected error: ${error}`);
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
  const { db } = await getFirebaseAdmin();
  const validatedFields = UpdateCandidateStatusSchema.safeParse({
    candidateId: formData.get('candidateId'),
    status: formData.get('status'),
  });

  if (!validatedFields.success) {
    return { errors: { _form: ['Invalid data provided.'] } };
  }

  const { candidateId, status } = validatedFields.data;

  try {
    const candidateRef = db.collection('candidates').doc(candidateId);
    const candidateDoc = await candidateRef.get();

    if (!candidateDoc.exists) {
      return { errors: { _form: ['Candidate not found.'] } };
    }

    const candidateData = candidateDoc.data() as Candidate;
    const jobDoc = await db.collection('jobs').doc(candidateData.jobAppliedFor).get();
    const jobTitle = jobDoc.exists ? (jobDoc.data() as Job).title : 'Unknown Job';
    
    // Get admin user info (simplified - in a real app, you'd get this from the session)
    const adminUserDoc = await db.collection('users').doc('admin').get();
    const adminName = adminUserDoc.exists ? (adminUserDoc.data() as User).name : 'Admin';

    // Update candidate status
    await candidateRef.update({ status: status });

    // Log the activity
    let activityType: 'shortlisted' | 'hired' | 'rejected' | 'interview_scheduled' = 'shortlisted';
    
    if (status === 'Hired') {
      activityType = 'hired';
    } else if (status === 'Rejected') {
      activityType = 'rejected';
    } else if (status === 'Interviewed') {
      activityType = 'interview_scheduled';
    }

    await logActivity(
      activityType,
      candidateId,
      candidateData.name,
      candidateData.jobAppliedFor,
      jobTitle,
      'admin', // admin user ID
      adminName,
      undefined,
      candidateData.userId
    );

    revalidatePath('/dashboard');
    revalidatePath('/candidates');
    revalidatePath(`/candidates/${candidateId}`);

    return { success: true, message: `Candidate has been ${status.toLowerCase()}.` };
  } catch (error) {
    console.error('Update Candidate Status Error:', error);
    return { errors: { _form: ['Failed to update candidate status.'] } };
  }
}


export type InterviewQuestionState = {
    questions?: string[];
    errors?: {
        jobTitle?: string[];
        _form?: string[];
    };
};

const InterviewQuestionSchema = z.object({
  jobTitle: z.string().min(2, 'Please enter a job title.'),
});


export async function getInterviewQuestions(prevState: InterviewQuestionState, formData: FormData): Promise<InterviewQuestionState> {
    const validatedFields = InterviewQuestionSchema.safeParse({
        jobTitle: formData.get('jobTitle'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    const { jobTitle } = validatedFields.data;

    try {
        const result = await generateInterviewQuestions({ jobTitle });
        if (!result || !result.questions) {
            return { errors: { _form: ['AI analysis returned no questions.'] } };
        }
        return { questions: result.questions };
    } catch (error) {
        console.error('AI Interview Question Error:', error);
        return { errors: { _form: ['The AI analysis failed. Please try again.'] } };
    }
}

export type ResumeParserState = {
  success?: boolean;
  parsedData?: {
    name: string;
    phone: string;
    skills: string[];
    qualification: string;
  };
  errors?: {
    resumeFile?: string[];
    _form?: string[];
  };
};

const ResumeParserSchema = z.object({
  resumeFile: z
    .custom<FileLike>((file) => isFileLike(file), {
      message: 'Please upload a resume file.',
    })
    .refine((file) => file.size > 0, 'The resume file cannot be empty.')
    .refine((file) => file.size < 5 * 1024 * 1024, 'File size must be less than 5MB.'),
});

export async function parseResumeAction(prevState: ResumeParserState, formData: FormData): Promise<ResumeParserState> {
  const validatedFields = ResumeParserSchema.safeParse({
    resumeFile: formData.get('resumeFile'),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { resumeFile } = validatedFields.data;

  try {
    const photoDataUri = await fileToDataURI(resumeFile);
    const result = await parseResume({ photoDataUri });

    if (!result) {
      return { errors: { _form: ['AI failed to parse the resume.'] } };
    }

    return { success: true, parsedData: result };
  } catch (error) {
    console.error('Resume Parser Action Error:', error);
    return { errors: { _form: ['An error occurred during resume parsing.'] } };
  }
}

export async function getInterviewsAction(candidateId: string): Promise<{ interviews?: Interview[], error?: string }> {
    const { db } = await getFirebaseAdmin();
    try {
        const snapshot = await db.collection('interviews')
            .where('candidateId', '==', candidateId)
            .orderBy('scheduledAt', 'desc')
            .get();

        const interviews = snapshot.docs.map((doc: any) => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // Convert Firestore Timestamps/Dates to ISO strings for serialization
                scheduledAt: data.scheduledAt instanceof Date ? data.scheduledAt.toISOString() : (data.scheduledAt?.toDate ? data.scheduledAt.toDate().toISOString() : data.scheduledAt),
                createdAt: data.createdAt instanceof Date ? data.createdAt.toISOString() : (data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt),
            } as Interview;
        });

        return { interviews };
    } catch (error) {
        console.error("Error fetching interviews:", error);
        return { error: "Failed to fetch interviews." };
    }
}


// Delete Job Action
const DeleteJobSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required.'),
  userId: z.string().min(1, 'User ID is required.'),
});

export type DeleteJobState = {
  success?: boolean;
  message?: string;
  errors?: {
    _form?: string[];
  };
};

export async function deleteJob(
  prevState: DeleteJobState,
  formData: FormData
): Promise<DeleteJobState> {
  const { db } = await getFirebaseAdmin();
  
  const validatedFields = DeleteJobSchema.safeParse({
    jobId: formData.get('jobId'),
    userId: formData.get('userId'),
  });

  if (!validatedFields.success) {
    return { errors: { _form: ['Invalid data provided.'] } };
  }

  const { jobId, userId } = validatedFields.data;

  try {
    // Fetch the job to verify ownership
    const jobDoc = await db.collection('jobs').doc(jobId).get();
    
    if (!jobDoc.exists) {
      return { errors: { _form: ['Job not found.'] } };
    }

    const jobData = jobDoc.data() as Job;

    // Verify that the user is the one who posted the job
    if (jobData.postedBy !== userId) {
      return { errors: { _form: ['You do not have permission to delete this job.'] } };
    }

    // Delete the job
    await db.collection('jobs').doc(jobId).delete();

    revalidatePath('/jobs');
    revalidatePath('/dashboard');

    return { success: true, message: 'Job deleted successfully.' };
  } catch (error) {
    console.error('Delete Job Error:', error);
    return { errors: { _form: ['An unexpected error occurred while deleting the job.'] } };
  }
}
