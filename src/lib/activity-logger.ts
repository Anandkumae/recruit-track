import { FieldValue } from 'firebase-admin/firestore';
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
    const timestamp = FieldValue.serverTimestamp();
    const activityData = {
      type,
      candidateId,
      candidateName,
      jobId,
      jobTitle,
      createdBy,
      createdByName,
      ...(candidateUserId && { candidateUserId }),
      timestamp,
      ...(metadata && { metadata: {
        ...(metadata.scheduledAt && { scheduledAt: metadata.scheduledAt }),
        ...(metadata.location && { location: metadata.location }),
        ...(metadata.meetingLink && { meetingLink: metadata.meetingLink }),
        ...(metadata.notes && { notes: metadata.notes }),
      }})
    };

    const batch = adminDb.batch();
    const activityRef = adminDb.collection('activities').doc();
    batch.set(activityRef, activityData);

    if (candidateUserId) {
      const candidateNotificationRef = adminDb
        .collection('users')
        .doc(candidateUserId)
        .collection('notifications')
        .doc(activityRef.id);

      batch.set(candidateNotificationRef, {
        ...activityData,
        globalActivityId: activityRef.id,
      });
    }

    await batch.commit();
    return { success: true, id: activityRef.id };
  } catch (error) {
    console.error('Error logging activity:', error);
    return { success: false, error };
  }
}
