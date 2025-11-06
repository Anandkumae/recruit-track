
'use server';

import { z } from 'zod';
import { matchResumeToJob, type MatchResumeToJobOutput } from '@/ai/flows/ai-match-resume-to-job';
import { getFirebaseAdmin } from '@/firebase/server-config';
import { FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { randomUUID } from 'crypto';

// Schema for a server action to upload a file to storage.
const UploadFileSchema = z.object({
  fileBuffer: z.string(), // Base64 encoded file
  fileName: z.string(),
  contentType: z.string(),
  userId: z.string().optional(),
});

// Server action to upload a file.
export async function uploadFile(input: z.infer<typeof UploadFileSchema>): Promise<{ fileUrl?: string; error?: string }> {
  try {
    const validated = UploadFileSchema.parse(input);
    const { fileBuffer, fileName, contentType, userId } = validated;

    const buffer = Buffer.from(fileBuffer, 'base64');
    const bucket = getStorage().bucket();
    const filePath = `resumes/${userId || 'public'}/${Date.now()}_${fileName}`;
    const file = bucket.file(filePath);

    await file.save(buffer, {
      metadata: {
        contentType,
      },
    });
    
    // Make the file public for simplicity, or generate a signed URL for private files
    await file.makePublic();

    return { fileUrl: file.publicUrl() };
  } catch (error) {
    console.error('File upload failed:', error);
    if (error instanceof z.ZodError) {
      return { error: 'Invalid file data.' };
    }
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
  // File related fields
  resumeFile: z.string(), // Base64 encoded file
  resumeFileName: z.string(),
  resumeFileType: z.string(),
  resumeFileText: z.string().min(50, 'Resume text must be at least 50 characters long.'),
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
    resumeFile: formData.get('resumeFile'),
    resumeFileName: formData.get('resumeFileName'),
    resumeFileType: formData.get('resumeFileType'),
    resumeFileText: formData.get('resumeFileText'),
  });

  if (!validatedFields.success) {
    console.error("Validation errors:", validatedFields.error.flatten().fieldErrors);
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const {
    name,
    email,
    jobId,
    jobTitle,
    jobDescription,
    userId,
    resumeFile,
    resumeFileName,
    resumeFileType,
    resumeFileText
  } = validatedFields.data;

  try {
    // 2. Upload the resume via the dedicated server action
    const uploadResult = await uploadFile({
      fileBuffer: resumeFile,
      fileName: resumeFileName,
      contentType: resumeFileType,
      userId: userId,
    });

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
      resumeUrl,
      jobAppliedFor: jobId,
      status: 'Applied',
      appliedAt: FieldValue.serverTimestamp(),
      userId: userId || null,
      matchScore: matchResult.matchScore,
      matchReasoning: matchResult.reasoning,
      skills: [], // Could be extracted by AI in the future
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
