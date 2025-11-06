
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
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

function SubmitButton({ isUploading }: { isUploading: boolean }) {
  const { pending } = useFormStatus();
  const isDisabled = isUploading || pending;

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
        ? 'Uploading...'
        : pending
        ? 'Submitting...'
        : 'Submit Application'}
    </Button>
  );
}

export function ApplyForm({ job }: { job: Job }) {
  const { user } = useUser();
  const { storage } = useFirebase(); // Get storage instance
  const initialState: ApplicationState = {};
  const [state, formAction] = useActionState(applyForJob, initialState);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
    if (user) {
      setName(user.displayName || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFile(file);
    }
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);

    if (!resumeFile) {
      setLocalError('A resume file is required.');
      return;
    }
    if (!user || !storage) {
      setLocalError('You must be logged in to apply.');
      return;
    }

    setIsUploading(true);

    try {
      // 1. Upload file to Firebase Storage
      const storageRef = ref(storage, `resumes/${user.uid}/${resumeFile.name}`);
      await uploadBytes(storageRef, resumeFile);
      const downloadURL = await getDownloadURL(storageRef);
      
      const text = await resumeFile.text();

      // 2. Prepare form data for server action
      const formData = new FormData(event.currentTarget);
      formData.set('resumeUrl', downloadURL);
      formData.set('resumeText', text); // Pass file content as text

      // 3. Trigger the server action
      formAction(formData);
    } catch (error) {
      console.error('Upload Error:', error);
      setLocalError('File upload failed. Please try again.');
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
            Thank you for applying. The hiring team will review your
            application. Your initial AI match score is{' '}
            {state.result?.matchScore || 'N/A'}.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const formErrors = state.errors || {};
  const submissionError = localError || formErrors._form?.[0];

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
                disabled={isUploading}
              />
              {formErrors.name && (
                <p className="text-sm text-destructive">{formErrors.name[0]}</p>
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
                disabled={isUploading}
              />
              {formErrors.email && (
                <p className="text-sm text-destructive">{formErrors.email[0]}</p>
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
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <p className="text-sm text-muted-foreground">
              PDF, DOC, DOCX, or TXT files only.
            </p>
            {formErrors.resumeUrl && (
              <p className="text-sm text-destructive">
                {formErrors.resumeUrl[0]}
              </p>
            )}
          </div>

          {submissionError && (
            <Alert variant="destructive">
              <AlertTitle>Submission Error</AlertTitle>
              <AlertDescription>{submissionError}</AlertDescription>
            </Alert>
          )}
          <SubmitButton isUploading={isUploading} />
        </form>
      </CardContent>
    </Card>
  );
}
