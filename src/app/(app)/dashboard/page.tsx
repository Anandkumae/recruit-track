'use client';

import React from 'react';
import { StatCard } from '@/components/dashboard/stat-card';
import { OverviewChart } from '@/components/dashboard/overview-chart';
import { Briefcase, Users, UserCheck, FileText, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Role, WithId, Candidate, Job } from '@/lib/types';
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
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
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
        </div>
      )}
    </div>
  );
}
