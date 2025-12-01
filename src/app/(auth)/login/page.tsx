'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";
import Link from "next/link";
import { Home, Building2, UserCircle2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get('role');

  // Redirect to role selection if no role is specified
  useEffect(() => {
    if (!role || (role !== 'employer' && role !== 'employee')) {
      router.push('/role-selection');
    }
  }, [role, router]);

  // Don't render if no valid role
  if (!role || (role !== 'employer' && role !== 'employee')) {
    return null;
  }

  const isEmployer = role === 'employer';
  const roleIcon = isEmployer ? Building2 : UserCircle2;
  const RoleIcon = roleIcon;

  return (
    <div className="relative w-full max-w-md">
      <Link 
        href="/role-selection" 
        className="fixed top-4 left-4 flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors z-50"
      >
        <Home className="h-4 w-4" />
        <span>Change Role</span>
      </Link>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <RoleIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">
                {isEmployer ? 'Employer Login' : 'Employee Login'}
              </CardTitle>
            </div>
          </div>
          <CardDescription>
            {isEmployer 
              ? 'Sign in to manage jobs and review candidates.' 
              : 'Sign in to browse jobs and track your applications.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
          <div className="mt-6 flex flex-col gap-2 text-center text-sm">
            <div className="text-muted-foreground">Don't have an account?</div>
            <div className="flex justify-center gap-4">
              <a href={`/signup?role=${role}`} className="font-medium text-primary hover:underline">
                Register as {isEmployer ? 'Employer' : 'Employee'}
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
