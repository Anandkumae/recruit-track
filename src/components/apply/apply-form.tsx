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
import { Loader2, PartyPopper, Send, Upload } from 'lucide-react';
import type { Job } from '@/lib/types';
import { useUser, useFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { applyForJob, type ApplicationState } from '@/lib/actions';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { z } from 'zod';
import { matchResumeToJob } from '@/ai/flows/ai-match-resume-to-job';
import { Textarea } from '../ui/textarea';


const ApplySchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.string().email('Invalid email address.'),
  resumeFile: z.instanceof(File).refine(file => file.size > 0, 'A resume file is required.'),
});


export function ApplyForm({ job }: { job: Job }) {
  const { user } = useUser();
  const { firestore, storage } = useFirebase();
  const initialState: ApplicationState = {};
  const [state, setState] = useState<ApplicationState>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
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
      resumeFile,
    });

    if (!validatedFields.success) {
      setState({ errors: validatedFields.error.flatten().fieldErrors });
      setIsSubmitting(false);
      return;
    }

    if (!firestore || !storage || !user) {
        setState({ errors: { _form: ["You must be logged in to apply."] }});
        setIsSubmitting(false);
        return;
    }

    const { name: validatedName, email: validatedEmail, resumeFile: validatedFile } = validatedFields.data;

    try {
      // 1. Upload Resume to Firebase Storage
      // Sanitize filename as recommended
      const sanitizedFileName = validatedFile.name.replace(/'/g, "");
      const fileRef = ref(storage, `resumes/${user.uid}/${Date.now()}_${sanitizedFileName}`);
      
      await uploadBytes(fileRef, validatedFile);
      const resumeUrl = await getDownloadURL(fileRef);

      // For AI analysis, we need the resume text. Since we can't read PDFs server-side easily,
      // and client-side parsing adds complexity, we'll use a placeholder for now.
      // A full implementation would involve a library like pdf-parse on the client or a Cloud Function.
      const resumeTextForAI = "Resume content from PDF would be extracted here for AI analysis.";


      // 2. Get AI Match Score (using placeholder text)
      const matchResult = await matchResumeToJob({
        resumeText: resumeTextForAI,
        jobDescription: `${job.title}\n\n${job.description}\n\nRequirements:\n${job.requirements.join('\n')}`,
      });

      // 3. Prepare Candidate Data for Firestore
      const candidateData = {
        name: validatedName,
        email: validatedEmail,
        phone: '',
        resumeUrl: resumeUrl, // The actual download URL
        jobAppliedFor: job.id,
        status: 'Applied' as const,
        appliedAt: serverTimestamp(),
        userId: user.uid,
        matchScore: matchResult.matchScore,
        matchReasoning: matchResult.reasoning,
        skills: [],
        avatarUrl: `https://picsum.photos/seed/${user.uid}/100/100`,
      };

      const candidatesCollection = collection(firestore, 'candidates');

      // 4. Save to Firestore
      addDoc(candidatesCollection, candidateData)
        .then((docRef) => {
          setState({
            message: 'Application submitted successfully!',
            result: {
              candidateId: docRef.id,
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
          setState({ errors: { _form: ['An unexpected error occurred while saving your application. Please try again.'] }});
        })
        .finally(() => {
          setIsSubmitting(false);
        });

    } catch (error) {
      console.error('Submission Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      setState({ errors: { _form: ['An unexpected error occurred during submission. Details: ' + errorMessage] }});
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

  if (state.message && !state.errors) {
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
                disabled={isSubmitting}
              />
              {state.errors?.email && (
                <p className="text-sm text-destructive">{state.errors.email[0]}</p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="resumeFile">Upload Resume (PDF)</Label>
            <Input 
                id="resumeFile"
                name="resumeFile"
                type="file"
                accept="application/pdf"
                onChange={(e) => setResumeFile(e.target.files ? e.target.files[0] : null)}
                required
                disabled={isSubmitting}
            />
            {state.errors?.resumeFile && (
                <p className="text-sm text-destructive">{state.errors.resumeFile[0]}</p>
            )}
          </div>

          {state.errors?._form && (
            <Alert variant="destructive">
              <AlertTitle>Submission Error</AlertTitle>
              <AlertDescription>{state.errors._form[0]}</AlertDescription>
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
