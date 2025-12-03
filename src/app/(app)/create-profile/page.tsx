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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';
import { useUser, useFirestore, useFirebase, useDoc, useMemoFirebase } from '@/firebase';
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
  const { firestore } = useFirebase();
  const router = useRouter();
  const [state, setState] = React.useState<ProfileState>({});
  
  // Fetch user document to check role
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  
  const { data: userDoc } = useDoc(userDocRef);
  const isEmployer = userDoc?.role === 'Admin' || userDoc?.role === 'HR';

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
    const companyName = formData.get('companyName') as string;
    const companyDescription = formData.get('companyDescription') as string;
    const companyWebsite = formData.get('companyWebsite') as string;
    const companySize = formData.get('companySize') as string;
    
    // Basic validation
    if (!name) {
        setState({ errors: { name: ['Name is required.']}});
        return;
    }
    
    if (!phone) {
        setState({ errors: { phone: ['Phone number is required.']}});
        return;
    }

    const userProfile: any = {
      id: user.uid,
      name,
      email: user.email,
      phone,
      qualification,
      createdAt: serverTimestamp(),
      // Role is already set during signup, don't overwrite it
    };
    
    // Add company fields if provided (for employers)
    if (companyName) userProfile.companyName = companyName;
    if (companyDescription) userProfile.companyDescription = companyDescription;
    if (companyWebsite) userProfile.companyWebsite = companyWebsite;
    if (companySize) userProfile.companySize = companySize;

    try {
      const userDocRef = doc(firestore, 'users', user.uid);
      await setDoc(userDocRef, userProfile, { merge: true });
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
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="e.g., +91 98765 43210"
                required
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
            
            {/* Company Information - Only for Employers */}
            {isEmployer && (
              <>
                <div className="pt-4 border-t">
                  <h3 className="text-lg font-semibold mb-4">Company Information</h3>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    placeholder="e.g., Acme Corporation"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyDescription">Company Description</Label>
                  <Textarea
                    id="companyDescription"
                    name="companyDescription"
                    placeholder="Brief description of your company..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyWebsite">Company Website</Label>
                  <Input
                    id="companyWebsite"
                    name="companyWebsite"
                    type="url"
                    placeholder="e.g., https://www.example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companySize">Company Size</Label>
                  <Input
                    id="companySize"
                    name="companySize"
                    placeholder="e.g., 50-200 employees"
                  />
                </div>
              </>
            )}
            
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
