import * as admin from 'firebase-admin';
import { adminDb } from './firebaseAdmin.server';

type ActivityType = 'shortlisted' | 'interview_scheduled' | 'hired' | 'rejected' | 'application_received';

interface ActivityMetadata {
  scheduledAt?: Date;
  location?: string;
  meetingLink?: string;
  notes?: string;
}

export async function logActivity(
  type: ActivityType,
  candidateId: string,
  candidateName: string,
  jobId: string,
  jobTitle: string,
  createdBy: string,
  createdByName: string,
  metadata?: ActivityMetadata,
  candidateUserId?: string
) {
  try {
    const activityData = {
      type,
      candidateId,
      candidateName,
      jobId,
      jobTitle,
      createdBy,
      createdByName,
      ...(candidateUserId && { candidateUserId }),
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ...(metadata && { metadata: {
        ...(metadata.scheduledAt && { scheduledAt: metadata.scheduledAt }),
        ...(metadata.location && { location: metadata.location }),
        ...(metadata.meetingLink && { meetingLink: metadata.meetingLink }),
        ...(metadata.notes && { notes: metadata.notes }),
      }})
    };

    const newActivityRef = await adminDb.collection('activities').add(activityData);
    return { success: true, id: newActivityRef.id };
  } catch (error) {
    console.error('Error logging activity:', error);
    return { success: false, error };
  }
}
