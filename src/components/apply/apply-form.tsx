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
import { Loader2, PartyPopper, Send, Upload } from 'lucide-react';
import type { Job } from '@/lib/types';
import { useUser, useFirestore, errorEmitter, FirestorePermissionError, useFirebase } from '@/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { z } from 'zod';
import { matchResumeToJob } from '@/ai/flows/ai-match-resume-to-job';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

type FormState = {
  message?: string | null;
  result?: { candidateId: string; matchScore: number };
  errors?: {
    name?: string[];
    email?: string[];
    resumeFile?: string[];
    _form?: string[];
  };
};

// We won't use a full resume text validator, but we'll check for the file
const ApplySchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.string().email('Invalid email address.'),
});

export function ApplyForm({ job }: { job: Job }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { storage } = useFirebase();
  const [state, setState] = useState<FormState>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setState({ errors: { resumeFile: ['Only PDF files are accepted.'] } });
        setResumeFile(null);
      } else if (file.size > 5 * 1024 * 1024) { // 5MB
        setState({ errors: { resumeFile: ['File size must be less than 5MB.'] } });
        setResumeFile(null);
      } else {
        setState({}); // Clear previous errors
        setResumeFile(file);
      }
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!resumeFile) {
        setState({ errors: { resumeFile: ['A resume PDF is required.'] } });
        return;
    }

    setIsSubmitting(true);
    setState({});

    const formData = new FormData(event.currentTarget);
    const validatedFields = ApplySchema.safeParse({
      name: formData.get('name'),
      email: formData.get('email'),
    });

    if (!validatedFields.success) {
      setState({ errors: validatedFields.error.flatten().fieldErrors });
      setIsSubmitting(false);
      return;
    }

    if (!firestore || !user || !storage) {
        setState({ errors: { _form: ["You must be logged in to apply."] }});
        setIsSubmitting(false);
        return;
    }

    const { name, email } = validatedFields.data;

    try {
      // 1. Upload Resume to Firebase Storage
      const storageRef = ref(storage, `resumes/${user.uid}/${Date.now()}_${resumeFile.name}`);
      await uploadBytes(storageRef, resumeFile);
      const resumeUrl = await getDownloadURL(storageRef);

      // We no longer have resume text for AI matching. 
      // We'll set a placeholder score and reasoning.
      const matchResult = {
        matchScore: 0,
        reasoning: "Resume uploaded as PDF. AI analysis of PDF content is not yet implemented.",
      };

      // 2. Prepare Candidate Data
      const candidateData = {
        name,
        email,
        phone: '',
        resumeText: '', // No longer storing text
        jobAppliedFor: job.id,
        status: 'Applied',
        appliedAt: serverTimestamp(),
        userId: user.uid,
        matchScore: matchResult.matchScore,
        matchReasoning: matchResult.reasoning,
        skills: [],
        avatarUrl: `https://picsum.photos/seed/${user.uid}/100/100`,
        resumeUrl: resumeUrl, // Store the download URL
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
          const permissionError = new FirestorePermissionError({
            path: candidatesCollection.path,
            operation: 'create',
            requestResourceData: candidateData,
          });
          errorEmitter.emit('permission-error', permissionError);
           setState({ errors: { _form: ['An unexpected error occurred while submitting. Please try again.'] }});
        })
        .finally(() => {
          setIsSubmitting(false);
        });

    } catch (error) {
        console.error('Application Submission Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        setState({ errors: { _form: ['An unexpected error occurred. Details: ' + errorMessage] }});
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
          Fill out the form below and upload your resume to submit your application.
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
             <Label htmlFor="resumeFile">Upload Your Resume (PDF)</Label>
              <Input
                id="resumeFile"
                name="resumeFile"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                required
                disabled={isSubmitting}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
            <p className="text-sm text-muted-foreground">
              Please upload your resume in PDF format (max 5MB).
            </p>
            {formErrors.resumeFile && (
              <p className="text-sm text-destructive">
                {formErrors.resumeFile[0]}
              </p>
            )}
          </div>

          {submissionError && (
            <Alert variant="destructive">
              <AlertTitle>Submission Error</AlertTitle>
              <AlertDescription>{submissionError}</AlertDescription>
            </Alert>
          )}
          
          <Button type="submit" disabled={isSubmitting || !resumeFile} className="w-full">
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
