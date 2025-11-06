'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, PartyPopper, Send, FileCheck2 } from 'lucide-react';
import type { Job } from '@/lib/types';
import { applyForJob, type ApplyState } from '@/lib/actions';
import { Progress } from '../ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';


function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Send className="mr-2 h-4 w-4" />
      )}
      Submit Application
    </Button>
  );
}

export function ApplyForm({ job }: { job: Job }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const initialState: ApplyState = {};
  const applyForJobWithId = applyForJob.bind(null);
  const [state, dispatch] = useActionState(applyForJobWithId, initialState);
  
  const [resumeText, setResumeText] = useState('');

   const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  useEffect(() => {
    if (userProfile?.resumeUrl) {
        setResumeText(`Resume content from ${userProfile.resumeUrl}`);
    } else {
        setResumeText('');
    }
  }, [userProfile]);

  if (state.message && state.result) {
    return (
      <Card>
        <CardHeader className="items-center text-center">
          <PartyPopper className="h-12 w-12 text-green-500" />
          <CardTitle className="text-2xl">Application Submitted!</CardTitle>
          <CardDescription>
            {state.message} Here is your initial AI match analysis.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div>
                <div className="flex items-baseline justify-between">
                  <Label>Match Score</Label>
                  <span className="text-2xl font-bold text-primary">
                    {state.result.matchScore}
                    <span className="text-sm text-muted-foreground">/100</span>
                  </span>
                </div>
                <Progress value={state.result.matchScore} className="mt-2" />
              </div>
              <div>
                <Label>AI Reasoning</Label>
                <p className="mt-1 text-sm text-foreground/80 rounded-md border bg-muted/50 p-3">
                  {state.result.reasoning}
                </p>
              </div>
        </CardContent>
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
        <form action={dispatch} className="space-y-4">
          <input type="hidden" name="jobId" value={job.id} />
          <input type="hidden" name="jobDescription" value={job.description} />
          {/* Hidden input to pass resume text to server action */}
          <input type="hidden" name="resume" value={resumeText} />
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" defaultValue={userProfile?.name || ''} required />
              {state.errors?.name && (
                <p className="text-sm font-medium text-destructive">
                  {state.errors.name[0]}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={userProfile?.email || ''}
                required
              />
               {state.errors?.email && (
                <p className="text-sm font-medium text-destructive">
                  {state.errors.email[0]}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="resume-display">Your Resume</Label>
            {isProfileLoading ? (
                 <div className="flex items-center justify-center rounded-md border h-40">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                 </div>
            ) : userProfile?.resumeUrl ? (
              <div className="p-4 rounded-md border bg-muted/50 text-sm">
                <div className="flex items-center gap-3">
                    <FileCheck2 className="h-6 w-6 text-green-600" />
                    <div>
                        <p className="font-medium">Using resume from your profile.</p>
                        <p className="text-muted-foreground text-xs">You can update it in the "My Profile" section.</p>
                    </div>
                </div>
              </div>
            ) : (
                <>
                    <Textarea
                    id="resume-display"
                    placeholder="You haven't uploaded a resume yet. Paste the full text of your resume here..."
                    rows={10}
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    required
                    />
                    <p className="text-sm text-muted-foreground">
                        For easier applications next time, upload your resume in the "My Profile" section.
                    </p>
                </>
            )}
             {state.errors?.resume && (
                <p className="text-sm font-medium text-destructive">
                  {state.errors.resume[0]}
                </p>
              )}
          </div>
          {state.errors?._form && (
                <p className="text-sm font-medium text-destructive">
                  {state.errors._form[0]}
                </p>
              )}
          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
