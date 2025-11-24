
'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Briefcase,
  Calendar,
  CheckCircle,
  ClipboardList,
  FileText,
  Loader2,
} from 'lucide-react';
import { ApplyForm } from '@/components/apply/apply-form';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Job, User, WithId } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

export default function ApplyPage() {
  const params = useParams();
  const router = useRouter();
  const rawJobId = params.jobId;
  const jobParam = Array.isArray(rawJobId) ? rawJobId[0] : rawJobId;
  const jobId = jobParam ? decodeURIComponent(jobParam) : '';
  const firestore = useFirestore();
  const { user } = useUser();

  const jobRef = useMemoFirebase(() => {
    if (!firestore || !jobId) return null;
    return doc(firestore, 'jobs', jobId);
  }, [firestore, jobId]);

  const {
    data: job,
    isLoading: jobLoading,
    error: jobError,
  } = useDoc<WithId<Job>>(jobRef);

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

  if (!user) {
      router.push(`/login?redirect=/apply/${jobId}`);
      return null;
  }

  if (!jobId) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 px-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Missing job information</CardTitle>
            <CardDescription>
              We couldn&rsquo;t determine which job you&rsquo;re applying for.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-end">
            <Button variant="outline" onClick={() => router.push('/jobs')}>
              Browse jobs
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (jobError) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 px-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>We couldn&rsquo;t load this job</CardTitle>
            <CardDescription>
              There may be a permissions or network issue. Please try again or
              reach out to your recruiter if it persists.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              Go back
            </Button>
            <Button onClick={() => router.refresh()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 px-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Job no longer available</CardTitle>
            <CardDescription>
              This posting may have been closed or removed. You can continue
              exploring other open roles.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-end">
            <Button onClick={() => router.push('/jobs')}>View jobs</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Not specified';
    if (typeof timestamp === 'object' && timestamp.toDate) {
      return format(timestamp.toDate(), 'MMM d, yyyy');
    }
    try {
      return format(new Date(timestamp), 'MMM d, yyyy');
    } catch {
      return 'Not specified';
    }
  };

  const requirements = Array.isArray(job.requirements)
    ? job.requirements
    : [];

  return (
    <div className="min-h-screen bg-muted/40 py-12 px-4">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <div className="flex items-center justify-center">
          <Link
            href="/"
            className="flex items-center gap-2 text-2xl font-semibold text-primary"
          >
            <Briefcase className="h-7 w-7" />
            LeoRecruit
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.15fr,0.85fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <CardTitle className="text-3xl font-bold">
                      {job.title}
                    </CardTitle>
                    <CardDescription className="text-base">
                      {job.department}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={job.status === 'Open' ? 'default' : 'secondary'}
                    className="w-fit"
                  >
                    {job.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Posted</p>
                    <p>{formatDate(job.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Status</p>
                    <p>
                      {job.status === 'Open'
                        ? 'Actively accepting applications'
                        : 'This role is currently closed'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileText className="h-4 w-4 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Summary</p>
                    <p className="text-foreground/80 whitespace-pre-wrap">
                      {job.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {requirements.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>What we&rsquo;re looking for</CardTitle>
                    <CardDescription>
                      Highlight how you meet these expectations in your
                      application.
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc space-y-2 pl-5 text-foreground/80">
                    {requirements.map((requirement, index) => (
                      <li key={`${job.id}-requirement-${index}`}>
                        {requirement}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:sticky lg:top-6">
            <ApplyForm job={job} userProfile={userProfile} />
          </div>
        </div>
      </div>
    </div>
  );
}
