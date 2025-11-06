'use server';

import { z } from 'zod';
import { matchResumeToJob } from '@/ai/flows/ai-match-resume-to-job';
import { randomUUID } from 'crypto';
import { getFirebaseAdmin } from '@/firebase/server-config';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getStorage as getAdminStorage } from 'firebase-admin/storage';
import { serverTimestamp } from 'firebase/firestore';


const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];

const ApplySchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.string().email('Invalid email address.'),
  jobId: z.string(),
  jobTitle: z.string(),
  jobDescription: z.string(),
  userId: z.string().optional(),
  resume: z
    .any()
    .refine((file) => file && file.size > 0, 'Resume is required.')
    .refine((file) => file && file.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (file) => file && ACCEPTED_FILE_TYPES.includes(file.type),
      '.pdf, .doc, .docx and .txt files are accepted.'
    ),
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
  const validatedFields = ApplySchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    jobId: formData.get('jobId'),
    jobTitle: formData.get('jobTitle'),
    jobDescription: formData.get('jobDescription'),
    userId: formData.get('userId'),
    resume: formData.get('resume'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, email, jobId, jobDescription, userId, resume } =
    validatedFields.data;

  try {
    const { firestore } = getFirebaseAdmin();
    const adminStorage = getAdminStorage();

    // 1. Upload file to Firebase Storage from the server
    const fileBuffer = Buffer.from(await resume.arrayBuffer());
    const filePath = `resumes/${userId || 'public'}/${Date.now()}_${resume.name}`;
    const file = adminStorage.bucket().file(filePath);

    await file.save(fileBuffer, {
        metadata: {
            contentType: resume.type,
        }
    });

    const [downloadURL] = await file.getSignedUrl({
        action: 'read',
        expires: '03-09-2491' // Far-future expiration date
    });
    
    // 2. Perform AI Match Analysis
    const resumeFileText = fileBuffer.toString('utf-8');
    const matchResult = await matchResumeToJob({
      resumeText: resumeFileText,
      jobDescription,
    });

    // 3. Save Candidate to Firestore
    const candidateData = {
      name,
      email,
      phone: '', 
      resumeUrl: downloadURL,
      jobAppliedFor: jobId,
      status: 'Applied',
      appliedAt: serverTimestamp(),
      userId: userId || null,
      matchScore: matchResult.matchScore,
      matchReasoning: matchResult.reasoning,
      skills: [],
      avatarUrl: `https://picsum.photos/seed/${randomUUID()}/100/100`,
    };

    const docRef = await firestore.collection("candidates").add(candidateData);

    // 4. Return Success State
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
