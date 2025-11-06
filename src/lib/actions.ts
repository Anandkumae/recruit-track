
'use server';

import { z } from 'zod';
import { matchResumeToJob } from '@/ai/flows/ai-match-resume-to-job';
import { getFirebaseAdmin } from '@/firebase/server-config';
import { FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { randomUUID } from 'crypto';

// Server action to upload a file.
async function uploadFile(
  fileContent: string,
  fileName: string,
  fileType: string,
  userId?: string
): Promise<{ fileUrl?: string; error?: string }> {
  try {
    const buffer = Buffer.from(fileContent, 'base64');
    const bucket = getStorage().bucket();
    const filePath = `resumes/${userId || 'public'}/${Date.now()}_${fileName}`;
    const bucketFile = bucket.file(filePath);

    await bucketFile.save(buffer, {
      metadata: {
        contentType: fileType,
      },
    });

    // Make the file public for simplicity
    await bucketFile.makePublic();

    return { fileUrl: bucketFile.publicUrl() };
  } catch (error) {
    console.error('File upload failed:', error);
    return { error: 'Failed to upload file.' };
  }
}

const ApplySchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.string().email('Invalid email address.'),
  jobId: z.string(),
  jobTitle: z.string(),
  jobDescription: z.string(),
  userId: z.string().optional(),
  resumeText: z.string().min(1, 'Resume content is missing.'),
  resumeFileName: z.string().min(1, 'Resume file name is missing.'),
  resumeFileType: z.string().min(1, 'Resume file type is missing.'),
});

export type ApplicationState = {
  message?: string | null;
  result?: { candidateId: string; matchScore: number };
  errors?: {
    name?: string[];
    email?: string[];
    resume?: string[];
    resumeText?: string[];
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
    resumeText: formData.get('resumeText'),
    resumeFileName: formData.get('resumeFileName'),
    resumeFileType: formData.get('resumeFileType'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const {
    name,
    email,
    jobId,
    jobDescription,
    userId,
    resumeText,
    resumeFileName,
    resumeFileType,
  } = validatedFields.data;

  try {
    // 2. Upload the resume via the dedicated server action
    const uploadResult = await uploadFile(
        resumeText,
        resumeFileName,
        resumeFileType,
        userId
    );
    
    if (uploadResult.error || !uploadResult.fileUrl) {
      throw new Error(uploadResult.error || 'File URL was not returned from upload.');
    }
    const resumeUrl = uploadResult.fileUrl;

    // 3. Perform AI Match Analysis
    const matchResult = await matchResumeToJob({
      resumeText: Buffer.from(resumeText, 'base64').toString('utf-8'),
      jobDescription: jobDescription,
    });

    // 4. Save Candidate to Firestore
    const { firestore } = getFirebaseAdmin();
    const candidateData = {
      name,
      email,
      phone: '', // Not collected in form currently
      resumeUrl,
      jobAppliedFor: jobId,
      status: 'Applied',
      appliedAt: FieldValue.serverTimestamp(),
      userId: userId || null,
      matchScore: matchResult.matchScore,
      matchReasoning: matchResult.reasoning,
      skills: [],
      avatarUrl: `https://picsum.photos/seed/${randomUUID()}/100/100`,
    };

    const candidateRef = await firestore.collection('candidates').add(candidateData);

    // 5. Return Success State
    return {
      message: 'Application submitted successfully!',
      result: {
        candidateId: candidateRef.id,
        matchScore: matchResult.matchScore,
      },
    };

  } catch (error) {
    console.error('Application Submission Error:', error);
    return {
      errors: { _form: ['An unexpected error occurred while submitting your application.'] },
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
  jobDescription: z.string().min(50, 'Job description must be at least 50 characters long.'),
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
