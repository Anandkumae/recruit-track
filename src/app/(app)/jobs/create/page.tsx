'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter } from "next/navigation";
import { doc } from "firebase/firestore";
import type { Role } from "@/lib/types";
import React from "react";

export default function CreateJobPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  React.useEffect(() => {
    if (isUserLoading || isProfileLoading) {
      return;
    }
    
    let userRole: Role = 'Candidate'; // Default to the most restrictive role

    if (user?.email === 'anandkumar.shinnovationco@gmail.com') {
      userRole = 'Admin';
    } else if (userProfile?.role) {
      userRole = userProfile.role;
    }

    const canCreateJob = userRole === 'Admin' || userRole === 'HR' || userRole === 'Manager';

    if (!canCreateJob) {
      router.replace('/dashboard');
    }

  }, [user, userProfile, isUserLoading, isProfileLoading, router]);

  const isLoading = isUserLoading || isProfileLoading;

  if(isLoading) {
    return (
       <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
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

      <Card>
          <CardHeader>
            <CardTitle>Under Construction</CardTitle>
            <CardDescription>This form is currently under development.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>The job creation form will be available here in a future update. For now, please enjoy the demo data.</p>
          </CardContent>
      </Card>
    </div>
  );
}
