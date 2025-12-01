'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, UserCircle2, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RoleSelectionPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-4xl space-y-8">
        {/* Back to Homepage Button */}
        <div className="flex justify-center">
          <Link href="/">
            <Button variant="outline" className="gap-2">
              <Home className="h-4 w-4" />
              Back to Homepage
            </Button>
          </Link>
        </div>
        
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Welcome to Leox</h1>
          <p className="text-xl text-muted-foreground">
            Choose how you'd like to continue
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Employer Card */}
          <Link href="/login?role=employer" className="block">
            <Card className="h-full cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border-2 hover:border-primary">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                  <Building2 className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-2xl">I'm an Employer</CardTitle>
                <CardDescription className="text-base">
                  Post jobs and find the best candidates
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-2">
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>✓ Post job openings</li>
                  <li>✓ Review applications</li>
                  <li>✓ Manage candidates</li>
                  <li>✓ Schedule interviews</li>
                </ul>
              </CardContent>
            </Card>
          </Link>

          {/* Employee Card */}
          <Link href="/login?role=employee" className="block">
            <Card className="h-full cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border-2 hover:border-primary">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                  <UserCircle2 className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-2xl">I'm an Employee</CardTitle>
                <CardDescription className="text-base">
                  Find and apply for your dream job
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-2">
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>✓ Browse job openings</li>
                  <li>✓ Submit applications</li>
                  <li>✓ Track application status</li>
                  <li>✓ Get interview notifications</li>
                </ul>
              </CardContent>
            </Card>
          </Link>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          By continuing, you agree to our{' '}
          <Link href="/terms" className="underline hover:text-foreground">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
