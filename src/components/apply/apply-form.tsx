
'use client';

import React, { useState, useEffect } from 'react';
import { useActionState } from 'react';
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
import { Button } from '@/components/ui/button';
import { Loader2, PartyPopper, Send, Upload } from 'lucide-react';
import type { Job } from '@/lib/types';
import { useUser, useFirebase } from '@/firebase';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { applyForJob, type ApplicationState } from '@/lib/actions';

function SubmitButton({ isUploading }: { isUploading: boolean }) {
  const { pending } = useFormStatus();
  const isDisabled = pending || isUploading;
  return (
    <Button type="submit" disabled={isDisabled} className="w-full">
      {isUploading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Send className="mr-2 h-4 w-4" />
      )}
      {isUploading
        ? 'Uploading Resume...'
        : pending
        ? 'Submitting...'
        : 'Submit Application'}
    </Button>
  );
}

export function ApplyForm({ job }: { job: Job }) {
  const { user } = useUser();
  const { firebaseApp } = useFirebase();
  const initialState: ApplicationState = {};
  const [state, formAction] = useActionState(applyForJob, initialState);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
    if (user) {
      setName(user.displayName || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setResumeFile(file);
    }
  };
  
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!resumeFile) {
        // This should be caught by the 'required' attribute, but as a safeguard:
         if (!state.errors) state.errors = {};
         state.errors.resume = ['Resume is required.'];
         return;
    }

    setIsUploading(true);

    try {
        // 1. Upload the file to Firebase Storage
        const storage = getStorage(firebaseApp);
        const storageRef = ref(storage, `resumes/${user?.uid || 'public'}/${Date.now()}_${resumeFile.name}`);
        await uploadBytes(storageRef, resumeFile);
        const downloadURL = await getDownloadURL(storageRef);

        // 2. Read resume text for AI analysis
        const resumeText = await resumeFile.text();

        // 3. Create FormData and submit to the server action
        const formData = new FormData(e.currentTarget);
        formData.set('resumeUrl', downloadURL);
        formData.set('resumeText', resumeText);
        // remove the file input from form data
        formData.delete('resume');

        formAction(formData);

    } catch (error) {
        console.error("Error during upload or submission:", error);
         if (!state.errors) state.errors = {};
        state.errors._form = ['Failed to upload resume. Please try again.'];
    } finally {
        setIsUploading(false);
    }
  }

  if (!isClient) {
    // Prevent hydration mismatch by not rendering the form on the server.
    return (
        <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  if (state.message) {
    return (
      <Card>
        <CardHeader className="items-center text-center">
          <PartyPopper className="h-12 w-12 text-green-500" />
          <CardTitle className="text-2xl">Application Submitted!</CardTitle>
          <CardDescription>
            Thank you for applying. The hiring team will review your application.
            Your initial AI match score is {state.result?.matchScore || 'N/A'}.
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
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <input type="hidden" name="jobId" value={job.id} />
          <input type="hidden" name="jobTitle" value={job.title} />
          <input type="hidden" name="jobDescription" value={job.description} />
          {user && <input type="hidden" name="userId" value={user.uid} />}

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
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="resume">Upload Resume</Label>
            <Input
              id="resume"
              name="resume"
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileChange}
              required
            />
            <p className="text-sm text-muted-foreground">
              PDF, DOC, DOCX, or TXT files only.
            </p>
            {state.errors?.resume && (
              <p className="text-sm text-destructive">{state.errors.resume[0]}</p>
            )}
          </div>

          {state.errors?._form && (
            <Alert variant="destructive">
              <AlertTitle>Submission Error</AlertTitle>
              <AlertDescription>{state.errors._form[0]}</AlertDescription>
            </Alert>
          )}
          <SubmitButton isUploading={isUploading} />
        </form>
      </CardContent>
    </Card>
  );
}
