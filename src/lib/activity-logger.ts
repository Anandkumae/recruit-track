import { doc, setDoc, collection, serverTimestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

const { firestore } = initializeFirebase();

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
  metadata?: ActivityMetadata
) {
  try {
    const activitiesRef = collection(firestore, 'activities');
    const newActivityRef = doc(activitiesRef);
    
    const activityData = {
      type,
      candidateId,
      candidateName,
      jobId,
      jobTitle,
      createdBy,
      createdByName,
      timestamp: serverTimestamp(),
      ...(metadata && { metadata: {
        ...(metadata.scheduledAt && { scheduledAt: metadata.scheduledAt }),
        ...(metadata.location && { location: metadata.location }),
        ...(metadata.meetingLink && { meetingLink: metadata.meetingLink }),
        ...(metadata.notes && { notes: metadata.notes }),
      }})
    };

    await setDoc(newActivityRef, activityData);
    return { success: true, id: newActivityRef.id };
  } catch (error) {
    console.error('Error logging activity:', error);
    return { success: false, error };
  }
}
