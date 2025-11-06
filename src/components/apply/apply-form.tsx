'use client';

import React, { useState, useEffect } from 'react';
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
import { useUser, useFirestore, errorEmitter, FirestorePermissionError, useFirebase } from '@/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { z } from 'zod';
import { matchResumeToJob } from '@/ai/flows/ai-match-resume-to-job';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Textarea } from '@/components/ui/textarea';

type FormState = {
  message?: string | null;
  result?: { candidateId: string; matchScore: number };
  errors?: {
    name?: string[];
    email?: string[];
    resumeText?: string[];
    _form?: string[];
  };
};

const ApplySchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.string().email('Invalid email address.'),
  resumeText: z.string().min(100, 'Resume text must be at least 100 characters.'),
});

export function ApplyForm({ job }: { job: Job }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [state, setState] = useState<FormState>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (user) {
      setName(user.displayName || '');
      setEmail(user.email || '');
    }
  }, [user]);
  
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setState({});

    const validatedFields = ApplySchema.safeParse({
      name,
      email,
      resumeText,
    });

    if (!validatedFields.success) {
      setState({ errors: validatedFields.error.flatten().fieldErrors });
      setIsSubmitting(false);
      return;
    }
    
    if (!firestore || !user) {
        setState({ errors: { _form: ["You must be logged in to apply."] }});
        setIsSubmitting(false);
        return;
    }

    const { name: validatedName, email: validatedEmail, resumeText: validatedResumeText } = validatedFields.data;

    try {
      // 1. Get AI Match Score
      const matchResult = await matchResumeToJob({
        resumeText: validatedResumeText,
        jobDescription: `${job.title}\n\n${job.description}\n\nRequirements:\n${job.requirements.join('\n')}`,
      });

      // 2. Prepare Candidate Data for Firestore
      const candidateData = {
        name: validatedName,
        email: validatedEmail,
        phone: '', // This can be added to the form if needed
        resumeText: validatedResumeText,
        jobAppliedFor: job.id,
        status: 'Applied',
        appliedAt: serverTimestamp(),
        userId: user.uid,
        matchScore: matchResult.matchScore,
        matchReasoning: matchResult.reasoning,
        skills: [], // Could be extracted by another AI flow in the future
        avatarUrl: `https://picsum.photos/seed/${user.uid}/100/100`,
        resumeUrl: '', // No longer using file uploads
      };

      const candidatesCollection = collection(firestore, 'candidates');

      // 3. Save to Firestore
      addDoc(candidatesCollection, candidateData)
        .then((docRef) => {
          setState({
            message: 'Application submitted successfully!',
            result: {
              candidateId: docRef.id,
              matchScore: matchResult.matchScore,
            },
          });
        })
        .catch((serverError) => {
          // This is the new error handling part.
          // Create the rich, contextual error.
          const permissionError = new FirestorePermissionError({
            path: candidatesCollection.path,
            operation: 'create',
            requestResourceData: candidateData,
          });
          // Emit the error for the global listener.
          errorEmitter.emit('permission-error', permissionError);
          // Also, set a local error for the UI.
           setState({ errors: { _form: ['An unexpected error occurred while submitting. Please try again.'] }});
        })
        .finally(() => {
          setIsSubmitting(false);
        });

    } catch (error) {
      console.error('AI Matching or Submission Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      setState({ errors: { _form: ['An AI analysis error occurred. Details: ' + errorMessage] }});
      setIsSubmitting(false);
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
            application.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const formErrors = state.errors || {};
  const submissionError = formErrors._form?.[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Apply for {job.title}</CardTitle>
        <CardDescription>
          Fill out the form below and paste your resume to submit your application.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isSubmitting}
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
                disabled={isSubmitting}
              />
              {formErrors.email && (
                <p className="text-sm text-destructive">{formErrors.email[0]}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="resumeText">Paste Your Resume</Label>
            <Textarea
              id="resumeText"
              name="resumeText"
              placeholder="Paste the full text of your resume here..."
              rows={12}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              required
              disabled={isSubmitting}
            />
             {formErrors.resumeText && (
              <p className="text-sm text-destructive">
                {formErrors.resumeText[0]}
              </p>
            )}
          </div>

          {submissionError && (
            <Alert variant="destructive">
              <AlertTitle>Submission Error</AlertTitle>
              <AlertDescription>{submissionError}</AlertDescription>
            </Alert>
          )}
          
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            {isSubmitting ? 'Submitting...' : 'Submit Application'}
          </Button>

        </form>
      </CardContent>
    </Card>
  );
}
