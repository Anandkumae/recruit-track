
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, PartyPopper, Send } from 'lucide-react';
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
