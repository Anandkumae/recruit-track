
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, PartyPopper, Send, FileText } from 'lucide-react';
import type { Job, User, WithId } from '@/lib/types';
import { useFirestore, useUser } from '@/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';
import { useActionState } from 'react';
import { applyForJob, type ApplicationState } from '@/lib/actions';

export function ApplyForm({ job, userProfile }: { job: WithId<Job>, userProfile: WithId<User> | null }) {
  const { user } = useUser();
  const router = useRouter();

  const [isClient, setIsClient] = useState(false);

  const initialState: ApplicationState = {
    jobId: job.id,
    userId: user?.uid || '',
  };

  const [state, formAction, isPending] = useActionState(applyForJob, initialState);

  console.log('[ApplyForm] Component mounted/rendered', { 
    jobId: job.id, 
    userId: user?.uid,
    hasUserProfile: !!userProfile 
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    console.log('[ApplyForm] State changed:', { success: state?.success, errors: state?.errors, isPending });
  }, [state, isPending]);

  useEffect(() => {
    if (state?.success) {
      console.log('[ApplyForm] Application successful, redirecting to dashboard');
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    }
  }, [state?.success, router]);

  if (!isClient) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Check if user has uploaded a resume
  const hasResume = userProfile?.resumeUrl || userProfile?.resumeText;

  if (!hasResume) {
    return (
      <Card>
        <CardHeader className="items-center text-center">
          <FileText className="h-12 w-12 text-amber-500 mb-2" />
          <CardTitle className="text-2xl">Resume Required</CardTitle>
          <CardDescription>
            You must upload a resume before you can apply for jobs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="default" className="border-amber-500/40 bg-amber-500/5">
            <AlertTitle>Why do I need a resume?</AlertTitle>
            <AlertDescription>
              Your resume helps employers understand your qualifications and experience. 
              It's a required part of the application process.
            </AlertDescription>
          </Alert>
          <Button 
            className="w-full" 
            onClick={() => router.push('/profile')}
          >
            Go to Profile to Upload Resume
          </Button>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => router.push('/jobs')}
          >
            Back to Jobs
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (state.success) {
    return (
      <Card>
        <CardHeader className="items-center text-center">
          <PartyPopper className="h-12 w-12 text-green-500" />
          <CardTitle className="text-2xl">Application Submitted!</CardTitle>
          <CardDescription>
            Thank you for applying. You will be redirected to your dashboard shortly.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Apply for {job.title}</CardTitle>
        <CardDescription>
          Fill out the form below to submit your application.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert variant="default" className="border-primary/40 bg-primary/5 text-sm text-foreground">
          <AlertTitle>Resume already on file</AlertTitle>
          <AlertDescription>
            We&rsquo;ll include the resume saved in your profile with this application. Update it from your profile before submitting if you need to make changes.
          </AlertDescription>
        </Alert>

        <form action={formAction} className="space-y-4 pt-4">
          {/* Hidden fields to pass necessary data to the server action */}
          <input type="hidden" name="resumeText" value={userProfile?.resumeText || ''} />
          <input type="hidden" name="resumeUrl" value={userProfile?.resumeUrl || ''} />
          <input type="hidden" name="avatarUrl" value={userProfile?.avatarUrl || ''} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={userProfile?.name || ''}
                required
              />
              {state.errors?.name && (
                <p className="text-sm text-destructive">{state.errors.name[0]}</p>
              )}
            </div>
           <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={user?.email || ''}
                readOnly
                className="bg-muted"
              />
            </div>
          </div>

           <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={userProfile?.phone || ''}
                required
              />
               {state.errors?.phone && (
                <p className="text-sm text-destructive">{state.errors.phone[0]}</p>
              )}
            </div>
          
          <div className="space-y-2">
            <Label htmlFor="applicationDescription">Why are you a good fit for this role? *</Label>
            <Textarea
              id="applicationDescription"
              name="applicationDescription"
              placeholder="Describe your relevant experience, skills, and why you're interested in this position..."
              rows={6}
              required
            />
            {state.errors?.applicationDescription && (
              <p className="text-sm text-destructive">{state.errors.applicationDescription[0]}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="requiredTimePeriod">Notice Period / Availability (Optional)</Label>
            <Input
              id="requiredTimePeriod"
              name="requiredTimePeriod"
              placeholder="e.g., 2 weeks notice, Immediate, 1 month"
            />
            {state.errors?.requiredTimePeriod && (
              <p className="text-sm text-destructive">{state.errors.requiredTimePeriod[0]}</p>
            )}
          </div>
          
          {state.errors?._form && (
            <Alert variant="destructive">
              <AlertTitle>Submission Error</AlertTitle>
              <AlertDescription>{state.errors._form[0]}</AlertDescription>
            </Alert>
          )}
          
          <Button
            type="submit"
            className="w-full"
            disabled={state.success || isPending}
            onClick={() => console.log('[ApplyForm] Submit button clicked', { isPending, success: state.success })}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" /> Submit Application
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
