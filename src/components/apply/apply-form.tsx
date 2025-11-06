'use client';

import React, { useState } from 'react';
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
import { useUser, useFirestore, useAuth } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

function SubmitButton({ isSubmitting }: { isSubmitting: boolean }) {
  return (
    <Button type="submit" disabled={isSubmitting} className="w-full">
      {isSubmitting ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Send className="mr-2 h-4 w-4" />
      )}
      {isSubmitting ? 'Submitting...' : 'Submit Application'}
    </Button>
  );
}

export function ApplyForm({ job }: { job: Job }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  
  const [name, setName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!resumeFile) {
        setError("Please upload a resume file.");
        setIsSubmitting(false);
        return;
    }

    if (!firestore || !auth?.app) {
        setError("Firebase is not initialized correctly.");
        setIsSubmitting(false);
        return;
    }

    try {
        const storage = getStorage(auth.app);
        
        // 1. Upload resume to Firebase Storage
        const resumeRef = ref(storage, `resumes/${user?.uid || 'anonymous'}/${Date.now()}_${resumeFile.name}`);
        await uploadBytes(resumeRef, resumeFile);
        const resumeURL = await getDownloadURL(resumeRef);

        // 2. Save candidate data to Firestore
        await addDoc(collection(firestore, "candidates"), {
            name,
            email,
            resumeUrl: resumeURL,
            jobAppliedFor: job.id,
            status: 'Applied',
            appliedAt: serverTimestamp(),
            userId: user?.uid || null
        });

        setSuccess(true);
    } catch (err: any) {
        console.error("Error submitting application:", err);
        setError(err.message || "Failed to submit application. Please check the console for details.");
    } finally {
        setIsSubmitting(false);
    }
  };


  if (success) {
    return (
      <Card>
        <CardHeader className="items-center text-center">
          <PartyPopper className="h-12 w-12 text-green-500" />
          <CardTitle className="text-2xl">Application Submitted!</CardTitle>
          <CardDescription>
            Thank you for applying. The hiring team will review your application.
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
                accept=".pdf,.doc,.docx"
                onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                required
            />
            <p className="text-sm text-muted-foreground">PDF, DOC, or DOCX files only.</p>
          </div>
          {error && (
              <Alert variant="destructive">
                <AlertTitle>Submission Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
          )}
          <SubmitButton isSubmitting={isSubmitting} />
        </form>
      </CardContent>
    </Card>
  );
}
