
'use server';

import { z } from 'zod';
import { matchResumeToJob } from '@/ai/flows/ai-match-resume-to-job';
import { FieldValue } from 'firebase-admin/firestore';
import { randomUUID } from 'crypto';
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

// Initialize a dedicated Firebase app instance for this server action
// This prevents conflicts with any client-side initialization.
const serverApp = initializeApp(firebaseConfig, 'server-action-app');
const storage = getStorage(serverApp);
const firestore = getFirestore(serverApp);


const ApplySchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.string().email('Invalid email address.'),
  jobId: z.string(),
  jobTitle: z.string(),
  jobDescription: z.string(),
  userId: z.string().optional(),
  resume: z.instanceof(File).refine(file => file.size > 0, { message: 'Resume is required.' }),
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

  // 1. Validate form data
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
     // 2. Upload the file to Firebase Storage from the server
    const fileBuffer = Buffer.from(await resume.arrayBuffer());
    const storageRef = ref(storage, `resumes/${userId || 'public'}/${Date.now()}_${resume.name}`);
    await uploadBytes(storageRef, fileBuffer, { contentType: resume.type });
    const downloadURL = await getDownloadURL(storageRef);

    // 3. Read resume text for AI analysis
    const resumeText = fileBuffer.toString('utf-8');

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
      appliedAt: new Date(), // Use JS Date on server, Firestore will convert it
      userId: userId || null,
      matchScore: matchResult.matchScore,
      matchReasoning: matchResult.reasoning,
      skills: [], // Skills can be extracted by another process if needed
      avatarUrl: `https://picsum.photos/seed/${randomUUID()}/100/100`,
    };

    const docRef = await addDoc(collection(firestore, "candidates"), candidateData);

    // 6. Return Success State
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
