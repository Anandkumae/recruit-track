'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from "firebase/firestore";
import type { Role } from "@/lib/types";
import React, { useEffect } from "react";
import { createJob, type CreateJobState } from '@/lib/actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Save className="mr-2 h-4 w-4" />
      )}
      Post Job
    </Button>
  );
}

export default function CreateJobPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const initialState: CreateJobState = {};
  const [state, formAction] = useActionState(createJob, initialState);

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  useEffect(() => {
    if (isUserLoading || isProfileLoading) return;
    
    let userRole: Role = 'Candidate';
    if (user?.email === 'anandkumar.shinnovationco@gmail.com') {
      userRole = 'Admin';
    } else if (userProfile?.role) {
      userRole = userProfile.role;
    }

    const canCreateJob = userRole === 'Admin' || userRole === 'HR' || userRole === 'Manager';

    if (!isUserLoading && !isProfileLoading && !canCreateJob) {
      router.replace('/dashboard');
    }
  }, [user, userProfile, isUserLoading, isProfileLoading, router]);

  const isLoading = isUserLoading || isProfileLoading;

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/jobs">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Job</h1>
          <p className="text-muted-foreground">
            Fill in the details to post a new job opening.
          </p>
        </div>
      </div>

      <form action={formAction}>
        <input type="hidden" name="postedBy" value={user?.uid || ''} />
        <Card>
          <CardHeader>
            <CardTitle>Job Details</CardTitle>
            <CardDescription>
              Provide the main information about the job.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title</Label>
              <Input id="title" name="title" placeholder="e.g., Senior Frontend Engineer" />
              {state.errors?.title && <p className="text-sm font-medium text-destructive">{state.errors.title[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input id="department" name="department" placeholder="e.g., Engineering" />
               {state.errors?.department && <p className="text-sm font-medium text-destructive">{state.errors.department[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Job Description</Label>
              <Textarea id="description" name="description" rows={6} placeholder="Describe the role, responsibilities, and what you're looking for." />
               {state.errors?.description && <p className="text-sm font-medium text-destructive">{state.errors.description[0]}</p>}
            </div>
             <div className="space-y-2">
              <Label htmlFor="requirements">Requirements</Label>
              <Textarea id="requirements" name="requirements" rows={6} placeholder="List the job requirements. Please enter one requirement per line." />
              <p className="text-xs text-muted-foreground">Enter each requirement on a new line.</p>
               {state.errors?.requirements && <p className="text-sm font-medium text-destructive">{state.errors.requirements[0]}</p>}
            </div>
            
             {state.errors?._form && (
                <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{state.errors._form[0]}</AlertDescription>
                </Alert>
            )}

          </CardContent>
        </Card>
        <div className="mt-6 flex justify-end">
            <SubmitButton />
        </div>
      </form>
    </div>
  );
}
