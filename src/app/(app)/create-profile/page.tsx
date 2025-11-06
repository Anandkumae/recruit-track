'use client';

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
import { Loader2, Save } from 'lucide-react';
import { useUser, useFirestore, useFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import React, { useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Save className="mr-2 h-4 w-4" />
      )}
      Save Profile
    </Button>
  );
}

type ProfileState = {
  message?: string | null;
  errors?: {
    name?: string[];
    phone?: string[];
    qualification?: string[];
    _form?: string[];
  };
};

export default function CreateProfilePage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [state, setState] = React.useState<ProfileState>({});

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState({});

    if (!user || !firestore) {
      setState({ errors: { _form: ['Authentication error. Please try again.'] } });
      return;
    }

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const qualification = formData.get('qualification') as string;
    
    // Basic validation
    if (!name) {
        setState({ errors: { name: ['Name is required.']}});
        return;
    }

    const userProfile = {
      id: user.uid,
      name,
      email: user.email,
      phone,
      qualification,
      createdAt: serverTimestamp(),
      role: 'Candidate', // Default role
    };

    try {
      const userDocRef = doc(firestore, 'users', user.uid);
      await setDoc(userDocRef, userProfile);
      router.push('/dashboard');
    } catch (error) {
      console.error('Error creating profile:', error);
      setState({ errors: { _form: ['Failed to save profile. Please try again.'] } });
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-muted/40">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          <CardDescription>
            Just a few more details to get you started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={user?.displayName || ''}
                placeholder="John Doe"
                required
              />
              {state.errors?.name && (
                <p className="text-sm font-medium text-destructive">
                  {state.errors.name[0]}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={user?.email || ''}
                disabled
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                placeholder="e.g., +91 98765 43210"
              />
              {state.errors?.phone && (
                <p className="text-sm font-medium text-destructive">
                  {state.errors.phone[0]}
                </p>
              )}
            </div>
             <div className="space-y-2">
              <Label htmlFor="qualification">Highest Qualification</Label>
              <Input
                id="qualification"
                name="qualification"
                placeholder="e.g., Bachelor's in Computer Science"
              />
               {state.errors?.qualification && (
                <p className="text-sm font-medium text-destructive">
                  {state.errors.qualification[0]}
                </p>
              )}
            </div>
            {state.errors?._form && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{state.errors._form[0]}</AlertDescription>
              </Alert>
            )}
            <SubmitButton />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
