
'use client';

import React from 'react';
import { StatCard } from '@/components/dashboard/stat-card';
import { OverviewChart } from '@/components/dashboard/overview-chart';
import { Briefcase, Users, UserCheck, FileText, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import type { Role, WithId, Candidate, Job } from '@/lib/types';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CandidateActivityFeed } from '@/components/dashboard/candidate-activity-feed';

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  // --- Role Determination ---
  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  // Determine user role from Firestore profile
  let userRole: Role = 'Candidate';
  if (userProfile?.role) {
    userRole = userProfile.role;
  }
  const isPrivilegedUser = userRole === 'Admin';


  // --- Data Fetching for Admin ---
  const jobsQuery = useMemoFirebase(() => {
    if (!firestore || !isPrivilegedUser || !user) return null;
    return query(collection(firestore, 'jobs'), where('postedBy', '==', user.uid));
  }, [firestore, isPrivilegedUser, user]);
  const { data: jobs, isLoading: jobsLoading } = useCollection<WithId<Job>>(jobsQuery);
  
  const candidatesQuery = useMemoFirebase(() => {
    if (!firestore || !isPrivilegedUser || !user) return null;
    return query(collection(firestore, 'candidates'), where('employerId', '==', user.uid));
  }, [firestore, isPrivilegedUser, user]);
  const { data: adminCandidates, isLoading: adminCandidatesLoading } = useCollection<WithId<Candidate>>(candidatesQuery);

  // --- Data Fetching for Candidate ---
  const candidateApplicationsQuery = useMemoFirebase(() => {
    if (!firestore || !user || isPrivilegedUser) return null;
    return query(collection(firestore, 'candidates'), where('userId', '==', user.uid));
  }, [firestore, user, isPrivilegedUser]);
  const { data: candidateApplications, isLoading: candidateAppsLoading } = useCollection<WithId<Candidate>>(candidateApplicationsQuery);

  const isLoading = isUserLoading || isProfileLoading || (isPrivilegedUser && (jobsLoading || adminCandidatesLoading)) || (!isPrivilegedUser && candidateAppsLoading);

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // --- Admin Dashboard Stats ---
  const totalJobs = jobs?.length || 0;
  const totalCandidates = adminCandidates?.length || 0;
  const shortlistedCandidates = adminCandidates?.filter(c => c.status === 'Shortlisted').length || 0;
  const hiredCandidates = adminCandidates?.filter(c => c.status === 'Hired').length || 0;
  
  // --- Candidate Dashboard Stats ---
  const applicationsSent = candidateApplications?.length || 0;
  const activeApplications = candidateApplications?.filter(c => c.status !== 'Hired' && c.status !== 'Rejected').length || 0;


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
        <div className="space-y-8">
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
              description="Total applications received."
            />
            <StatCard
              title="Shortlisted"
              value={shortlistedCandidates}
              icon={UserCheck}
              description="Candidates currently shortlisted."
            />
            <StatCard
              title="Hired"
              value={hiredCandidates}
              icon={CheckCircle}
              description="Candidates successfully hired."
            />
          </div>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
             <div className="lg:col-span-3">
                <OverviewChart candidates={adminCandidates || []} />
             </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 mb-8">
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
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Your Activity Feed</CardTitle>
              <CardDescription>Updates on your job applications</CardDescription>
            </CardHeader>
            <CardContent>
              <CandidateActivityFeed userId={user?.uid || ''} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
