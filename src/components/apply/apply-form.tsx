
'use client';

import React, { useState, useEffect, useActionState } from 'react';
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
import { Loader2, PartyPopper, Send } from 'lucide-react';
import type { Job } from '@/lib/types';
import { useUser, useFirebase } from '@/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { applyForJob, type ApplicationState } from '@/lib/actions';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Send className="mr-2 h-4 w-4" />
      )}
      {pending ? 'Submitting...' : 'Submit Application'}
    </Button>
  );
}

function FormFields({ isUploading, name, setName, email, setEmail, state }: { isUploading: boolean, name: string, setName: (name: string) => void, email: string, setEmail: (email: string) => void, state: ApplicationState }) {
    const { pending } = useFormStatus();
    const submissionPending = isUploading || pending;

    return (
        <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                    id="name"
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={submissionPending}
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
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={submissionPending}
                />
                {state.errors?.email && (
                    <p className="text-sm text-destructive">{state.errors.email[0]}</p>
                )}
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="resume">Upload Resume</Label>
                <Input
                id="resume"
                name="resume"
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                required
                disabled={submissionPending}
                />
                <p className="text-sm text-muted-foreground">
                PDF, DOC, DOCX, or TXT files only.
                </p>
                {state.errors?.resumeUrl && (
                <p className="text-sm text-destructive">{state.errors.resumeUrl[0]}</p>
                )}
            </div>
        </>
    );
}

export function ApplyForm({ job }: { job: Job }) {
  const { user } = useUser();
  const { storage } = useFirebase();
  const initialState: ApplicationState = {};
  const [state, formAction] = useActionState(applyForJob, initialState);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
    if (user) {
      setName(user.displayName || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploadError(null);

    const formData = new FormData(e.currentTarget);
    const resumeFile = formData.get('resume') as File;

    if (!resumeFile || resumeFile.size === 0) {
      setUploadError('A resume file is required.');
      return;
    }
    if (!user || !storage) {
        setUploadError('You must be logged in to apply.');
        return;
    }

    setIsUploading(true);

    try {
      // 1. Upload file from the client
      const storageRef = ref(storage, `resumes/${user.uid}/${Date.now()}_${resumeFile.name}`);
      const uploadResult = await uploadBytes(storageRef, resumeFile);
      const downloadURL = await getDownloadURL(uploadResult.ref);

      // 2. Read file content as text on the client for AI analysis
      const resumeText = await resumeFile.text();

      // 3. Append the download URL and text to form data for the server action
      formData.set('resumeUrl', downloadURL);
      formData.set('resumeText', resumeText);
      
      // 4. Trigger the server action
      formAction(formData);

    } catch (error) {
      console.error("Upload failed:", error);
      setUploadError("File upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };
  
  if (!isClient) {
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

            <FormFields 
                isUploading={isUploading}
                name={name}
                setName={setName}
                email={email}
                setEmail={setEmail}
                state={state}
            />

          {uploadError && (
            <p className="text-sm text-destructive">{uploadError}</p>
          )}

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
