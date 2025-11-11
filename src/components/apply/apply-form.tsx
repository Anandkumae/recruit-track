
'use client';

import React, { useState, useEffect } from 'react';
import { useActionState } from 'react-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, PartyPopper, Send } from 'lucide-react';
import type { Job, User, WithId } from '@/lib/types';
import { useUser } from '@/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { applyForJob, type ApplicationState } from '@/lib/actions';
import { Textarea } from '../ui/textarea';
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
     <Button type="submit" className="w-full" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" /> Submit Application
          </>
        )}
      </Button>
  );
}


export function ApplyForm({ job, userProfile }: { job: WithId<Job>, userProfile: WithId<User> | null }) {
  const { user } = useUser();
  const initialState: ApplicationState = { jobId: job.id, userId: user?.uid ?? '' };
  const [state, formAction] = useActionState(applyForJob, initialState);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (userProfile) {
      setName(userProfile.name || '');
      setPhone(userProfile.phone || '');
    }
    if (user) {
      setEmail(user.email || '');
    }
  }, [user, userProfile]);

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
        <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                value={email}
                readOnly
                disabled
              />
              {state.errors?.email && (
                <p className="text-sm text-destructive">{state.errors.email[0]}</p>
              )}
            </div>
          </div>

           <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
               {state.errors?.phone && (
                <p className="text-sm text-destructive">{state.errors.phone[0]}</p>
              )}
            </div>
          
          <div className="space-y-2">
            <Label htmlFor="resumeText">Paste your Resume</Label>
            <Textarea 
                id="resumeText"
                name="resumeText"
                rows={10}
                placeholder="Paste the full text of your resume here..."
                required
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
            />
             <p className="text-xs text-muted-foreground">
                For best results with our AI Matcher, please paste the full text content of your resume.
            </p>
            {state.errors?.resumeText && (
                <p className="text-sm text-destructive">{state.errors.resumeText[0]}</p>
            )}
          </div>

          {state.errors?._form && (
            <Alert variant="destructive">
              <AlertTitle>Submission Error</AlertTitle>
              <AlertDescription>{state.errors._form[0]}</AlertDescription>
            </Alert>
          )}
          
          <SubmitButton />

        </form>
      </CardContent>
    </Card>
  );
}
