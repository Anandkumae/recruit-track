
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, PartyPopper, Send } from 'lucide-react';
import type { Job, User, WithId } from '@/lib/types';
import { useFirestore, useUser } from '@/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

export function ApplyForm({ job, userProfile }: { job: WithId<Job>, userProfile: WithId<User> | null }) {
  const { user } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (userProfile) {
      setName(userProfile.name || '');
      setPhone(userProfile.phone || '');
    }
    if (user) {
      setEmail(user.email || '');
    }
  }, [user, userProfile]);

  useEffect(() => {
    if (isSuccess) {
        setTimeout(() => {
            router.push('/dashboard');
        }, 2000);
    }
  }, [isSuccess, router]);

  const resumeDetails = useMemo(() => {
    return {
      resumeText:
        typeof userProfile?.resumeText === 'string' ? userProfile.resumeText : '',
      resumeUrl:
        typeof userProfile?.resumeUrl === 'string' ? userProfile.resumeUrl : undefined,
    };
  }, [userProfile]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const errors: Record<string, string> = {};
    if (!name.trim()) {
      errors.name = 'Name is required.';
    }
    if (!phone.trim()) {
      errors.phone = 'Phone number is required.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    if (!user || !firestore) {
      setFormError('You must be signed in to submit an application.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFieldErrors({});
      setFormError(null);

      const userDocRef = doc(firestore, 'users', user.uid);
      const userUpdates: Record<string, unknown> = {
        name,
        phone,
      };

      if (resumeDetails.resumeText) {
        userUpdates.resumeText = resumeDetails.resumeText;
      }

      if (resumeDetails.resumeUrl) {
        userUpdates.resumeUrl = resumeDetails.resumeUrl;
      }

      await setDoc(userDocRef, userUpdates, { merge: true });

      const candidateData: Record<string, unknown> = {
        name,
        email,
        phone,
        jobAppliedFor: job.id,
        status: 'Applied',
        appliedAt: serverTimestamp(),
        userId: user.uid,
        avatarUrl: `https://picsum.photos/seed/${user.uid}/100/100`,
        matchScore: null,
        matchReasoning: 'Resume analysis pending',
        skills: [],
      };

      if (resumeDetails.resumeText) {
        candidateData.resumeText = resumeDetails.resumeText;
      }

      if (resumeDetails.resumeUrl) {
        candidateData.resumeUrl = resumeDetails.resumeUrl;
      }

      await addDoc(collection(firestore, 'candidates'), candidateData);

      setIsSuccess(true);
    } catch (error) {
      console.error('Application submission failed:', error);
      setFormError(
        'We were unable to submit your application. Please try again or contact support.',
      );
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

  if (isSuccess) {
    return (
      <Card>
        <CardHeader className="items-center text-center">
          <PartyPopper className="h-12 w-12 text-green-500" />
          <CardTitle className="text-2xl">Application Submitted!</CardTitle>
          <CardDescription>
            Thank you for applying. You will be redirected to your dashboard shortly.
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
        <Alert variant="default" className="border-primary/40 bg-primary/5 text-sm text-foreground">
          <AlertTitle>Resume already on file</AlertTitle>
          <AlertDescription>
            We&rsquo;ll include the resume saved in your profile with this application. Update it from your profile before submitting if you need to make changes.
          </AlertDescription>
        </Alert>

        <form className="space-y-4" onSubmit={handleSubmit}>
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
              {fieldErrors.name && (
                <p className="text-sm text-destructive">{fieldErrors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                readOnly
                disabled
              />
            </div>
          </div>

           <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
               {fieldErrors.phone && (
                <p className="text-sm text-destructive">{fieldErrors.phone}</p>
              )}
            </div>
          
          {formError && (
            <Alert variant="destructive">
              <AlertTitle>Submission Error</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" /> Submit Application
              </>
            )}
          </Button>

        </form>
      </CardContent>
    </Card>
  );
}
