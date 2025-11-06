'use client';

import React, { useState, useEffect, useActionState } from 'react';
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
import { useFormStatus } from 'react-dom';

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

  // State for client-side rendering control and form inputs
  const [isClient, setIsClient] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState('');

  // Ensure component only renders on client to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);
    if (user) {
      setName(user.displayName || '');
      setEmail(user.email || '');
    }
  }, [user]);

  if (!isClient) {
    // Render nothing on the server to prevent hydration errors
    return null;
  }
  
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
        <form action={formAction} className="space-y-4">
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
                name="resume" // Name is used by FormData
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
                readOnly // This should be derived from the file, not user-editable
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
