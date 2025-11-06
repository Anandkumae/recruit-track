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
import { useUser, useFirestore } from '@/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { z } from 'zod';
import { matchResumeToJob } from '@/ai/flows/ai-match-resume-to-job';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { randomUUID } from 'crypto';

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

    const formData = new FormData(event.currentTarget);
    const validatedFields = ApplySchema.safeParse({
      name: formData.get('name'),
      email: formData.get('email'),
      resumeText: formData.get('resumeText'),
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

    const { name, email, resumeText } = validatedFields.data;

    try {
      // 1. AI Match Analysis (Client-side)
      const matchResult = await matchResumeToJob({
        resumeText: resumeText,
        jobDescription: job.description,
      });

      // 2. Save Candidate to Firestore (Client-side)
      const candidateData = {
        name,
        email,
        phone: '',
        resumeText: resumeText,
        jobAppliedFor: job.id,
        status: 'Applied',
        appliedAt: serverTimestamp(),
        userId: user.uid,
        matchScore: matchResult.matchScore,
        matchReasoning: matchResult.reasoning,
        skills: [],
        avatarUrl: `https://picsum.photos/seed/${user.uid}/100/100`,
        resumeUrl: '', // No file upload, so no URL
      };

      const candidatesCollection = collection(firestore, 'candidates');
      const docRef = await addDoc(candidatesCollection, candidateData);

      // 3. Set success state
      setState({
        message: 'Application submitted successfully!',
        result: {
          candidateId: docRef.id,
          matchScore: matchResult.matchScore,
        },
      });
    } catch (error) {
      console.error('Application Submission Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      setState({
        errors: {
          _form: ['An unexpected error occurred while submitting. Please try again. Details: ' + errorMessage],
        },
      });
    } finally {
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
            application. Your initial AI match score is{' '}
            {state.result?.matchScore || 'N/A'}.
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
          Fill out the form below to submit your application.
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
                required
                disabled={isSubmitting}
              />
            <p className="text-sm text-muted-foreground">
              Please paste the plain text from your resume. This will be used for AI matching.
            </p>
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
