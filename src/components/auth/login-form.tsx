'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function LoginForm() {
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError(null);
    try {
      initiateAnonymousSignIn(auth);
    } catch (err) {
        setError('Failed to sign in. Please try again.');
        setIsLoggingIn(false);
    }
  };

  React.useEffect(() => {
    if (!isUserLoading && user) {
        router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  return (
    <form onSubmit={handleLogin} className="grid gap-4">
      {error && (
        <Alert variant="destructive">
            <AlertTitle>Login Failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className='text-center text-sm text-muted-foreground'>
        <p>This demo uses anonymous sign-in for simplicity.</p>
        <p>Click the button below to proceed.</p>
      </div>
      <Button type="submit" className="w-full" disabled={isLoggingIn || isUserLoading}>
        {(isLoggingIn || isUserLoading) ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : null}
        Sign In Anonymously
      </Button>
    </form>
  );
}
