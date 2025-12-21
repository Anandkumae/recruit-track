
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import type { Role, JobCategory } from "@/lib/types";
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

const JOB_CATEGORIES: JobCategory[] = [
    'Commissioning Engineer',
    'Service Engineer',
    'Project Engineer',
    'Technician'
];

const CreateJobSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters."),
    department: z.string().min(2, "Department is required."),
    jobCategory: z.enum(['Commissioning Engineer', 'Service Engineer', 'Project Engineer', 'Technician'], {
        errorMap: () => ({ message: "Please select a job category." })
    }),
    description: z.string().min(50, "Description must be at least 50 characters."),
    requirements: z.string().min(1, "At least one requirement is needed."),
});


export default function CreateJobPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [selectedCategory, setSelectedCategory] = useState<JobCategory | ''>('');


  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  useEffect(() => {
    if (isUserLoading || isProfileLoading) return;
    
    let userRole: Role = 'Candidate';
    if (userProfile?.role) {
      userRole = userProfile.role;
    }

    const canCreateJob = userRole === 'Admin' || userRole === 'HR' || userRole === 'Manager';

    if (!isUserLoading && !isProfileLoading && !canCreateJob) {
      router.replace('/dashboard');
    }
  }, [user, userProfile, isUserLoading, isProfileLoading, router]);

  const isLoading = isUserLoading || isProfileLoading;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    if (!user || !firestore) {
        setErrors({ _form: 'You must be logged in to create a job.' });
        return;
    }
    
    const formData = new FormData(e.currentTarget);
    
    const validatedFields = CreateJobSchema.safeParse({
        title: formData.get('title'),
        department: formData.get('department'),
        jobCategory: selectedCategory,
        description: formData.get('description'),
        requirements: formData.get('requirements'),
    });

    if (!validatedFields.success) {
        setErrors(validatedFields.error.flatten().fieldErrors);
        return;
    }

    setIsSubmitting(true);

    try {
        const { title, department, jobCategory, description, requirements } = validatedFields.data;
        const jobData = {
            title,
            department,
            jobCategory,
            description,
            requirements: requirements.split('\n').filter((req: string) => req.trim() !== ''),
            postedBy: user.uid,
            status: 'Open' as const,
            createdAt: serverTimestamp(),
        };

        await addDoc(collection(firestore, 'jobs'), jobData);

        toast({
            title: 'Job Posted!',
            description: 'The new job has been successfully created.',
        });
        
        router.push('/jobs');
    } catch (error) {
        console.error('Job Creation Error:', error);
        setErrors({ _form: 'Failed to create job. Please try again.' });
    } finally {
        setIsSubmitting(false);
    }
  };

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

      <form onSubmit={handleSubmit}>
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
              <Input id="title" name="title" placeholder="e.g., Senior Commissioning Engineer" disabled={isSubmitting} />
              {errors?.title && <p className="text-sm font-medium text-destructive">{errors.title[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input id="department" name="department" placeholder="e.g., Mechanical Engineering" disabled={isSubmitting}/>
               {errors?.department && <p className="text-sm font-medium text-destructive">{errors.department[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobCategory">Job Category *</Label>
              <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as JobCategory)} disabled={isSubmitting}>
                <SelectTrigger>
                  <SelectValue placeholder="Select mechanical engineering role" />
                </SelectTrigger>
                <SelectContent>
                  {JOB_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors?.jobCategory && <p className="text-sm font-medium text-destructive">{errors.jobCategory[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Job Description</Label>
              <Textarea id="description" name="description" rows={6} placeholder="Describe the role, responsibilities, and what you're looking for." disabled={isSubmitting}/>
               {errors?.description && <p className="text-sm font-medium text-destructive">{errors.description[0]}</p>}
            </div>
             <div className="space-y-2">
              <Label htmlFor="requirements">Requirements</Label>
              <Textarea id="requirements" name="requirements" rows={6} placeholder="List the job requirements. Please enter one requirement per line." disabled={isSubmitting}/>
              <p className="text-xs text-muted-foreground">Enter each requirement on a new line.</p>
               {errors?.requirements && <p className="text-sm font-medium text-destructive">{errors.requirements[0]}</p>}
            </div>
            
             {errors?._form && (
                <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{errors._form}</AlertDescription>
                </Alert>
            )}

          </CardContent>
        </Card>
        <div className="mt-6 flex justify-end">
             <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Save className="mr-2 h-4 w-4" />
                )}
                Post Job
            </Button>
        </div>
      </form>
    </div>
  );
}
