'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import type { Role } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = React.useState<Role>('HR');
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    login(selectedRole);
    // Add a small delay to simulate network request and allow auth state to propagate
    setTimeout(() => {
      router.push('/dashboard');
    }, 500);
  };

  return (
    <form onSubmit={handleLogin} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="role-select">Select a Role to Sign In As</Label>
        <Select
          value={selectedRole}
          onValueChange={(value) => setSelectedRole(value as Role)}
        >
          <SelectTrigger id="role-select" className="w-full">
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Admin">Admin</SelectItem>
            <SelectItem value="HR">HR Manager</SelectItem>
            <SelectItem value="Manager">Hiring Manager</SelectItem>
            <SelectItem value="Candidate">Candidate</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full" disabled={isLoggingIn}>
        {isLoggingIn ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : null}
        Sign In
      </Button>
    </form>
  );
}
