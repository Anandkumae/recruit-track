
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
import { Loader2, PartyPopper, Send } from 'lucide-react';
import type { Job } from '@/lib/types';
import { useUser } from '@/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { applyForJob, type ApplicationState } from '@/lib/actions';
import { Textarea } from '../ui/textarea';

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

// Helper to read file as Base64
const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });

// Helper to read file as text
const toText = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

export function ApplyForm({ job }: { job: Job }) {
  const { user } = useUser();
  const initialState: ApplicationState = {};
  const [state, formAction] = useActionState(applyForJob, initialState);

  // Initialize state with empty strings to ensure server and client match
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState('');

  // Use useEffect to populate the form on the client side after hydration
  useEffect(() => {
    if (user) {
      setName(user.displayName || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      setResumeFile(file);
      if (file) {
          try {
              const text = await toText(file);
              setResumeText(text);
          } catch (error) {
              console.error("Error reading file text:", error);
              setResumeText('');
          }
      } else {
          setResumeText('');
      }
  }

  const handleFormAction = async (formData: FormData) => {
    if (!resumeFile) {
        // This should be caught by the required attribute, but as a fallback
        alert("Please select a resume file.");
        return;
    }
    try {
        const base64File = await toBase64(resumeFile);
        
        formData.set('resumeFile', base64File);
        formData.set('resumeFileName', resumeFile.name);
        formData.set('resumeFileType', resumeFile.type);
        // The resume text is now in state, but we also need it in the action
        formData.set('resumeFileText', resumeText);
        
        formAction(formData);

    } catch (error) {
        console.error("Error processing file:", error);
        alert("There was an error processing your resume. Please try again.");
    }
  };


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
        <form action={handleFormAction} className="space-y-4">
          {/* Hidden fields for job and user info */}
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
                name="resume" // Name is handled manually, not submitted directly
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileChange}
                required
            />
            <p className="text-sm text-muted-foreground">PDF, DOC, DOCX, or TXT files only.</p>
            {state.errors?.resumeFile && <p className="text-sm text-destructive">{state.errors.resumeFile[0]}</p>}
          </div>

           <div className="space-y-2">
              <Label htmlFor="resumeFileText">Resume Text (for AI Match)</Label>
              <Textarea
                id="resumeFileText"
                name="resumeFileText"
                placeholder="The text from your resume will appear here automatically after you upload it."
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                rows={8}
                required
              />
               {state.errors?.resumeFileText && <p className="text-sm font-medium text-destructive">{state.errors.resumeFileText[0]}</p>}
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
