'use client';

import { useFirestore } from '@/firebase';
import { collection, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { Loader2, CheckCircle, UserCheck, Calendar, XCircle, Mail, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useEffect, useState, useMemo } from 'react';

type ActivityType = 'shortlisted' | 'interview_scheduled' | 'hired' | 'rejected' | 'application_received';

interface Activity {
  id: string;
  type: ActivityType;
  candidateId: string;
  candidateName: string;
  jobId: string;
  jobTitle: string;
  timestamp: Timestamp | Date;
  metadata?: {
    scheduledAt?: Timestamp | Date;
    location?: string;
    meetingLink?: string;
    notes?: string;
  };
  createdBy: string;
  createdByName: string;
}

const getActivityIcon = (type: ActivityType) => {
  switch (type) {
    case 'shortlisted':
      return <UserCheck className="h-5 w-5 text-blue-500" />;
    case 'interview_scheduled':
      return <Calendar className="h-5 w-5 text-purple-500" />;
    case 'hired':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'rejected':
      return <XCircle className="h-5 w-5 text-red-500" />;
    case 'application_received':
      return <Mail className="h-5 w-5 text-amber-500" />;
    default:
      return <Clock className="h-5 w-5 text-gray-500" />;
  }
};

const getActivityMessage = (activity: Activity) => {
  const { type, createdByName, metadata, jobTitle } = activity;
  const scheduledAt = metadata?.scheduledAt 
    ? metadata.scheduledAt instanceof Date 
      ? metadata.scheduledAt 
      : metadata.scheduledAt.toDate()
    : null;
  const formattedDate = scheduledAt ? format(scheduledAt, 'PPpp') : '';
  
  switch (type) {
    case 'shortlisted':
      return `You've been shortlisted for ${jobTitle} by ${createdByName}`;
    case 'interview_scheduled':
      return `Interview scheduled for ${jobTitle} on ${formattedDate}`;
    case 'hired':
      return `Congratulations! You've been hired for ${jobTitle} by ${createdByName}`;
    case 'rejected':
      return `Application for ${jobTitle} has been rejected by ${createdByName}`;
    case 'application_received':
      return `Your application for ${jobTitle} has been received`;
    default:
      return 'Status updated';
  }
};

export function CandidateActivityFeed({ userId }: { userId: string }) {
  const firestore = useFirestore();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activitiesQuery = useMemo(() => {
    if (!firestore) return null;
    try {
      const q = query(
        collection(firestore, 'activities'),
        where('candidateId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(10)
      );
      console.log('[ActivityFeed] Built query for userId', userId);
      return q;
    } catch (err) {
      console.error('Error creating query:', err);
      setError('Failed to create query. Please try again.');
      return null;
    }
  }, [firestore, userId]);

  const [snapshot, loading, queryError] = useCollection(activitiesQuery, {
    snapshotListenOptions: { includeMetadataChanges: true },
  });

  useEffect(() => {
    console.log('[ActivityFeed] Firestore instance:', !!firestore);
    console.log('[ActivityFeed] userId:', userId);
    console.log('[ActivityFeed] loading:', loading, 'queryError:', queryError);

    if (queryError) {
      console.error('Firestore query error:', queryError);
      setError('Failed to load activities. Please refresh the page.');
      setIsLoading(false);
      return;
    }

    if (snapshot) {
      try {
        console.log('[ActivityFeed] snapshot size:', snapshot.size);
        const activitiesData = snapshot.docs.map(doc => {
          const data = doc.data() as any;
          const timestamp = data.timestamp?.toDate ? data.timestamp.toDate() : new Date();
          return {
            id: doc.id,
            ...data,
            timestamp,
          } as Activity;
        });
        console.log('[ActivityFeed] mapped activities:', activitiesData);
        setActivities(activitiesData);
        setError(null);
      } catch (err) {
        console.error('Error processing activities:', err);
        setError('Failed to process activities data.');
      }
      setIsLoading(false);
    }
  }, [snapshot, queryError, loading, firestore, userId]);

  if (isLoading || loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading activities...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 text-sm text-blue-500 hover:underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-8">
        <p>No activities found.</p>
        <p className="text-sm">Your application updates will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const activityDate = activity.timestamp instanceof Date 
          ? activity.timestamp 
          : (activity.timestamp as Timestamp).toDate();
          
        return (
          <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border">
            <div className="flex-shrink-0 mt-0.5">
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{getActivityMessage(activity)}</p>
              <p className="text-xs text-muted-foreground">
                {format(activityDate, 'PPpp')}
              </p>
              {activity.metadata?.notes && (
                <div className="mt-2 text-sm text-muted-foreground p-2 bg-muted rounded">
                  {activity.metadata.notes}
                </div>
              )}
              {activity.type === 'interview_scheduled' && activity.metadata?.meetingLink && (
                <div className="mt-2">
                  <a 
                    href={activity.metadata.meetingLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    Join Meeting
                  </a>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
