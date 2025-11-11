
'use client';

import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { Briefcase, Loader2 } from 'lucide-react';
import { ApplyForm } from '@/components/apply/apply-form';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Job, User, WithId } from '@/lib/types';

export default function ApplyPage() {
  const params = useParams();
  const jobId = params.jobId as string;
  const firestore = useFirestore();
  const { user } = useUser();

  const jobRef = useMemoFirebase(() => {
    if (!firestore || !jobId) return null;
    return doc(firestore, 'jobs', jobId);
  }, [firestore, jobId]);

  const { data: job, isLoading: jobLoading } = useDoc<WithId<Job>>(jobRef);

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: profileLoading } = useDoc<WithId<User>>(userProfileRef);

  const isLoading = jobLoading || profileLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-muted/40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!job) {
    notFound();
  }

  return (
    <div className="w-full max-w-2xl mx-auto py-12 px-4">
        <div className="mb-8 flex justify-center">
            <Link
                href="/"
                className="flex items-center gap-2 text-2xl font-bold text-primary"
            >
                <Briefcase className="h-7 w-7" />
                LeoRecruit
            </Link>
        </div>
        <ApplyForm job={job} userProfile={userProfile} />
    </div>
  );
}
