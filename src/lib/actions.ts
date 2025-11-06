
'use server';

import { z } from 'zod';
import { matchResumeToJob } from '@/ai/flows/ai-match-resume-to-job';
import { randomUUID } from 'crypto';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { firebaseConfig } from '@/firebase/config';

// Initialize a dedicated Firebase app instance for server actions if it doesn't exist
const serverActionApp = !getApps().find(app => app.name === 'serverActionApp')
  ? initializeApp(firebaseConfig, 'serverActionApp')
  : getApp('serverActionApp');

const firestore = getFirestore(serverActionApp);
const storage = getStorage(serverActionApp);
const auth = getAuth(serverActionApp);

// Ensure the server is authenticated to perform actions
const ensureServerAuth = async () => {
    if (auth.currentUser === null) {
        await signInAnonymously(auth);
    }
};

const ApplySchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.string().email('Invalid email address.'),
  jobId: z.string(),
  jobTitle: z.string(),
  jobDescription: z.string(),
  userId: z.string().optional(),
  resume: z.instanceof(File).refine(file => file.size > 0, 'A resume file is required.'),
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
    // 1. Ensure server is authenticated
    await ensureServerAuth();
    
    // 2. Read file content for upload and AI analysis
    const resumeBuffer = await resume.arrayBuffer();
    const resumeText = Buffer.from(resumeBuffer).toString('utf-8');

    // 3. Upload file to Firebase Storage
    const storageRef = ref(storage, `resumes/${userId || 'guest'}/${Date.now()}_${resume.name}`);
    const uploadResult = await uploadBytes(storageRef, resumeBuffer);
    const downloadURL = await getDownloadURL(uploadResult.ref);

    // 4. Perform AI Match Analysis
    const matchResult = await matchResumeToJob({
      resumeText,
      jobDescription,
    });

    // 5. Save Candidate to Firestore
    const candidateData = {
      name,
      email,
      phone: '', // Not collected in form currently
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

    const docRef = await addDoc(collection(firestore, "candidates"), candidateData);

    // Return Success State
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
