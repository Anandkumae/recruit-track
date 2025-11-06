
'use server';

import { z } from 'zod';
import { matchResumeToJob } from '@/ai/flows/ai-match-resume-to-job';
import { getFirebaseAdmin } from '@/firebase/server-config';
import { FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { randomUUID } from 'crypto';

// Server action to upload a file.
async function uploadFile(
  file: File,
  userId?: string
): Promise<{ fileUrl?: string; error?: string }> {
  try {
    const fileBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(fileBuffer);
    const bucket = getStorage().bucket();
    const filePath = `resumes/${userId || 'public'}/${Date.now()}_${file.name}`;
    const bucketFile = bucket.file(filePath);

    await bucketFile.save(buffer, {
      metadata: {
        contentType: file.type,
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
  resumeFile: z.instanceof(File, { message: 'Resume file is required.' }),
  resumeFileText: z.string().min(50, 'Resume text must be at least 50 characters long.'),
});

export type ApplicationState = {
  message?: string | null;
  result?: { candidateId: string; matchScore: number };
  errors?: {
    name?: string[];
    email?: string[];
    resumeFile?: string[];
    resumeFileText?: string[];
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
    resumeFile: formData.get('resume'),
    resumeFileText: formData.get('resumeFileText'),
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
    resumeFile,
    resumeFileText,
  } = validatedFields.data;

  try {
    // 2. Upload the resume via the dedicated server action
    const uploadResult = await uploadFile(resumeFile, userId);

    if (uploadResult.error || !uploadResult.fileUrl) {
      throw new Error(uploadResult.error || 'File URL was not returned from upload.');
    }
    const resumeUrl = uploadResult.fileUrl;

    // 3. Perform AI Match Analysis
    const matchResult = await matchResumeToJob({
      resumeText: resumeFileText,
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
