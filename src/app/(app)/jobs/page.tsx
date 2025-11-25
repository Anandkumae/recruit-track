
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PlusCircle, Search, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useActionState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { Role, WithId, Job, User } from '@/lib/types';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { format } from 'date-fns';
import { collection, doc, query, orderBy, where } from 'firebase/firestore';
import { deleteJob, type DeleteJobState } from '@/lib/actions';

function PosterName({ userId }: { userId: string }) {
  const firestore = useFirestore();
  const userRef = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return doc(firestore, 'users', userId);
  }, [firestore, userId]);
  const { data: user, isLoading } = useDoc<User>(userRef);

  if (isLoading) return <Loader2 className="h-4 w-4 animate-spin" />;
  return <>{user?.name || 'Unknown'}</>;
}

function DeleteJobButton({ jobId, userId }: { jobId: string; userId: string }) {
  const [state, formAction] = useActionState<DeleteJobState, FormData>(deleteJob, {});
  const [isOpen, setIsOpen] = useState(false);

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Job</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this job? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <form action={formAction}>
            <input type="hidden" name="jobId" value={jobId} />
            <input type="hidden" name="userId" value={userId} />
            <AlertDialogAction type="submit" className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}


export default function JobsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<User>(userProfileRef);

  let userRole: Role = 'Candidate';
  if (user?.email === 'anandkumar.shinnovationco@gmail.com') {
    userRole = 'Admin';
  } else if (userProfile?.role) {
    userRole = userProfile.role;
  }

  const jobsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    
    // For Candidates, show all jobs
    if (userRole === 'Candidate') {
        return query(collection(firestore, 'jobs'), orderBy('createdAt', 'desc'));
    }

    // For Employers (Admin/HR/Manager), only show their own jobs
    // Note: Removed orderBy to avoid potential missing index issues. Sorting can be done client-side if needed.
    if (user && (userRole === 'Admin' || userRole === 'HR' || userRole === 'Manager')) {
         return query(collection(firestore, 'jobs'), where('postedBy', '==', user.uid));
    }
    
    return null;
  }, [firestore, userRole, user]);

  const { data: jobs, isLoading: jobsLoading } = useCollection<WithId<Job>>(jobsQuery);
  




  const filteredJobs = jobs?.filter((job) =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canCreateJob = userRole === 'Admin' || userRole === 'HR' || userRole === 'Manager';
  
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    if (timestamp.toDate) {
      return format(timestamp.toDate(), 'MMM d, yyyy');
    }
    try {
        const date = new Date(timestamp);
        return format(date, 'MMM d, yyyy');
    } catch {
        return 'Invalid Date';
    }
  }

  if (isUserLoading || isProfileLoading) {
    return (
       <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }


  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Job Listings</h1>
        <p className="text-muted-foreground">
          Browse and manage job postings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>All Jobs</CardTitle>
              <CardDescription>A list of all jobs in your organization.</CardDescription>
            </div>
            {canCreateJob && (
              <Button asChild>
                <Link href="/jobs/create">
                  <PlusCircle className="mr-2 h-4 w-4" /> Create Job
                </Link>
              </Button>
            )}
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search jobs by title or department..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Posted On</TableHead>
                <TableHead>Posted By</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobsLoading ? (
                 <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                       <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                    </TableCell>
                </TableRow>
              ) : filteredJobs && filteredJobs.length > 0 ? (
                filteredJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.title}</TableCell>
                    <TableCell>{job.department}</TableCell>
                    <TableCell>
                      <Badge variant={job.status === 'Open' ? 'default' : 'secondary'}>
                        {job.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatDate(job.createdAt)}
                    </TableCell>
                    <TableCell><PosterName userId={job.postedBy} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/jobs/${job.id}`}>View</Link>
                        </Button>
                        {user && job.postedBy === user.uid && (
                          <DeleteJobButton jobId={job.id} userId={user.uid} />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    No jobs found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
