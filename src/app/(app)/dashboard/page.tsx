'use client';

import React from 'react';
import { StatCard } from '@/components/dashboard/stat-card';
import { OverviewChart } from '@/components/dashboard/overview-chart';
import { Briefcase, Users, UserCheck, FileText, Clock, CheckCircle, Loader2, Calendar, MapPin, Link as LinkIcon } from 'lucide-react';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { Role, WithId, Candidate, Job, Interview } from '@/lib/types';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  // --- Role Determination ---
  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  let userRole: Role = 'Candidate';
  if (user?.email === 'anandkumar.shinnovationco@gmail.com') {
    userRole = 'Admin';
  } else if (userProfile?.role) {
    userRole = userProfile.role;
  }
  const isPrivilegedUser = userRole === 'Admin' || userRole === 'HR' || userRole === 'Manager';

  // --- Data Fetching for Admin ---
  const jobsQuery = useMemoFirebase(() => {
    if (!firestore || !isPrivilegedUser) return null;
    return collection(firestore, 'jobs');
  }, [firestore, isPrivilegedUser]);
  const { data: jobs, isLoading: jobsLoading } = useCollection<Job>(jobsQuery);

  const candidatesQuery = useMemoFirebase(() => {
    if (!firestore || !isPrivilegedUser) return null;
    return collection(firestore, 'candidates');
  }, [firestore, isPrivilegedUser]);
  const { data: candidates, isLoading: candidatesLoading } = useCollection<Candidate>(candidatesQuery);

  // --- Data Fetching for Candidate ---
  const candidateApplicationsQuery = useMemoFirebase(() => {
    if (!firestore || !user || isPrivilegedUser) return null;
    return query(collection(firestore, 'candidates'), where('userId', '==', user.uid));
  }, [firestore, user, isPrivilegedUser]);
  const { data: candidateApplications, isLoading: candidateAppsLoading } = useCollection<Candidate>(candidateApplicationsQuery);

  // Fetch interviews for the candidate
  // Only create query after candidateApplications has loaded (not undefined)
  const candidateIds = React.useMemo(() => {
    if (!candidateApplications) return [];
    const ids = candidateApplications.map(c => c.id).filter(Boolean);
    return ids;
  }, [candidateApplications]);
  
  // Determine if we're ready to query interviews
  const isReadyForInterviewsQuery = React.useMemo(() => {
    // Must have firestore and user
    if (!firestore || !user || !user.uid) return false;
    
    // Must not be a privileged user (they don't need this query)
    if (isPrivilegedUser) return false;
    
    // Must have finished loading candidate applications
    if (candidateAppsLoading) return false;
    
    // Must have candidate applications data (can be empty array, but must be defined)
    if (candidateApplications === undefined) return false;
    
    // Must have at least one candidate ID
    if (!Array.isArray(candidateIds) || candidateIds.length === 0) return false;
    
    // Must have at least one valid candidate ID
    const validIds = candidateIds.filter(id => typeof id === 'string' && id.trim().length > 0);
    if (validIds.length === 0) return false;
    
    return true;
  }, [firestore, user?.uid, isPrivilegedUser, candidateAppsLoading, candidateApplications, candidateIds]);
  
  // Fetch interviews for the candidate - only create query when ready
  const interviewsQuery = useMemoFirebase(() => {
    // Only create query if we're ready
    if (!isReadyForInterviewsQuery) return null;
    
    // Get valid candidate IDs
    const validIds = candidateIds.filter(id => typeof id === 'string' && id.trim().length > 0);
    const idsToQuery = validIds.length > 10 ? validIds.slice(0, 10) : validIds;
    
    // Final safety check
    if (!idsToQuery || idsToQuery.length === 0) return null;
    
    // Create the query
    return query(
      collection(firestore, 'interviews'),
      where('candidateId', 'in', idsToQuery),
      orderBy('scheduledAt', 'desc')
    );
  }, [isReadyForInterviewsQuery, firestore, candidateIds]);
  const { data: interviews, isLoading: interviewsLoading } = useCollection<WithId<Interview>>(interviewsQuery);

  const isLoading = isUserLoading || isProfileLoading || (isPrivilegedUser && (jobsLoading || candidatesLoading)) || (!isPrivilegedUser && candidateAppsLoading);

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // --- Admin Dashboard Stats ---
  const totalJobs = jobs?.length || 0;
  const totalCandidates = candidates?.length || 0;
  const hiredCandidates = candidates?.filter(c => c.status === 'Hired').length || 0;
  const shortlistedCandidates = candidates?.filter(c => c.status === 'Shortlisted').length || 0;

  // --- Candidate Dashboard Stats ---
  const applicationsSent = candidateApplications?.length || 0;
  const activeApplications = candidateApplications?.filter(c => c.status !== 'Hired' && c.status !== 'Rejected').length || 0;
  const interviewsScheduled = interviews?.filter(i => i.status === 'Scheduled').length || 0;


  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          {isPrivilegedUser
            ? 'An overview of your recruitment process.'
            : 'Your personal application overview.'}
        </p>
      </div>

      {isPrivilegedUser ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Jobs"
              value={totalJobs}
              icon={Briefcase}
              description="Number of open and closed positions."
            />
            <StatCard
              title="Total Candidates"
              value={totalCandidates}
              icon={Users}
              description="Total number of applicants in the system."
            />
            <StatCard
              title="Shortlisted"
              value={shortlistedCandidates}
              icon={UserCheck}
              description="Candidates moved to the next stage."
            />
            <StatCard
              title="Hired"
              value={hiredCandidates}
              icon={CheckCircle}
              description="Successful hires this cycle."
            />
          </div>
          <div className="grid grid-cols-1 gap-8">
            <OverviewChart candidates={candidates || []} />
          </div>
        </>
      ) : (
         <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title="Applications Sent"
              value={applicationsSent}
              icon={FileText}
              description="Total jobs you have applied for."
            />
            <StatCard
              title="Active Applications"
              value={activeApplications}
              icon={Clock}
              description="Applications currently under review."
            />
            <StatCard
              title="Interviews"
              value={interviewsScheduled}
              icon={Users}
              description="Interviews scheduled."
            />
          </div>
          
          {interviews && interviews.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Scheduled Interviews</CardTitle>
                <CardDescription>Your upcoming and past interviews.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {interviews.map((interview) => {
                    const formatDateTime = (timestamp: any) => {
                      if (!timestamp) return 'N/A';
                      try {
                        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
                        return format(date, 'MMM d, yyyy h:mm a');
                      } catch {
                        return 'Invalid Date';
                      }
                    };
                    
                    const isUpcoming = interview.status === 'Scheduled' && 
                      (interview.scheduledAt?.toDate ? interview.scheduledAt.toDate() > new Date() : new Date(interview.scheduledAt) > new Date());
                    
                    return (
                      <div
                        key={interview.id}
                        className={`border rounded-lg p-4 space-y-3 ${isUpcoming ? 'bg-primary/5 border-primary/20' : ''}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {formatDateTime(interview.scheduledAt)}
                              </span>
                              <Badge
                                variant={
                                  interview.status === 'Scheduled'
                                    ? 'default'
                                    : interview.status === 'Completed'
                                    ? 'secondary'
                                    : 'destructive'
                                }
                              >
                                {interview.status}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <span className="font-medium">{interview.jobTitle}</span>
                            </div>
                            {interview.location && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                {interview.location}
                              </div>
                            )}
                            {interview.meetingLink && (
                              <div className="flex items-center gap-2">
                                <LinkIcon className="h-3 w-3 text-muted-foreground" />
                                <a
                                  href={interview.meetingLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-primary hover:underline"
                                >
                                  Join Meeting
                                </a>
                              </div>
                            )}
                            {interview.notes && (
                              <p className="text-sm text-muted-foreground mt-2">
                                {interview.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
