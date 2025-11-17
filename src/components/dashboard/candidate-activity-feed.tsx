
'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import { Loader2, CheckCircle, UserCheck, Calendar, XCircle, Mail, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';

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

  const activitiesQuery = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return query(
        collection(firestore, 'users', userId, 'notifications'),
        orderBy('timestamp', 'desc'),
        limit(10)
      );
  }, [firestore, userId]);

  const { data: snapshot, isLoading, error } = useCollection<Activity>(activitiesQuery);

  const activities = snapshot?.map(doc => ({
      ...doc,
      timestamp: doc.timestamp instanceof Date ? doc.timestamp : (doc.timestamp as Timestamp).toDate(),
  }));

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading activities...</span>
      </div>
    );
  }

  if (error) {
    console.error('Firestore query error:', error);
    return (
      <div className="text-center text-red-500 p-4">
        <p>Failed to load activities. Please refresh the page.</p>
      </div>
    );
  }

  if (!activities || activities.length === 0) {
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
        const activityDate = activity.timestamp;
          
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
