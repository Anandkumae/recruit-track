'use client';

import * as React from 'react';
import { useAuth, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSearchParams } from 'next/navigation';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.519-3.356-11.024-7.944l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.99,36.596,44,31.016,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
);


export function LoginForm() {
  const auth = useAuth();
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role');
  
  // Convert URL role parameter to internal role
  const role = roleParam === 'employer' ? 'Admin' : 'Candidate';
  
  const [isEmailSubmitting, setIsEmailSubmitting] = React.useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = React.useState(false);
  const [isPhoneSubmitting, setIsPhoneSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  // Phone auth state
  const [phone, setPhone] = React.useState('');
  const [verificationCode, setVerificationCode] = React.useState('');
  const [confirmationResult, setConfirmationResult] = React.useState<ConfirmationResult | null>(null);
  const recaptchaVerifierRef = React.useRef<RecaptchaVerifier | null>(null);

  React.useEffect(() => {
    if (!recaptchaVerifierRef.current && auth) {
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
            'size': 'invisible',
            'callback': (response: any) => {}
        });
    }
  }, [auth]);


  const handleEmailLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsEmailSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Role is set during registration and should not be changed during login
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
        setIsEmailSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleSubmitting(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      const userCredential = await signInWithPopup(auth, provider);
      
      // Check if user document exists in Firestore
      if (userCredential.user) {
        const userDocRef = doc(firestore, 'users', userCredential.user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        // If user document doesn't exist, create it with the role from URL parameter
        // This only happens for NEW users logging in for the first time
        if (!userDocSnap.exists()) {
          await setDoc(userDocRef, {
            email: userCredential.user.email,
            role: role,
            createdAt: new Date().toISOString(),
          });
          console.log('[LoginForm] Google login - New user registered with role:', role);
        } else {
          // Existing user - do NOT change their role
          console.log('[LoginForm] Google login - Existing user, keeping role:', userDocSnap.data()?.role);
        }
      }
    } catch (err: any) {
        setError(err.message || 'Failed to sign in with Google.');
    } finally {
        setIsGoogleSubmitting(false);
    }
  };

  const handlePhoneCodeSend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const phoneNumber = `+91${phone}`;
    if (phoneNumber.length !== 13) { // +91 and 10 digits
        setError("Please enter a valid 10-digit Indian phone number.");
        return;
    }
    setError(null);
    setIsPhoneSubmitting(true);
    try {
      if (!recaptchaVerifierRef.current) throw new Error("reCAPTCHA not initialized.");
      const result = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifierRef.current);
      setConfirmationResult(result);
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code.');
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.render().then((widgetId) => {
          if (typeof grecaptcha !== 'undefined' && grecaptcha.reset) {
            grecaptcha.reset(widgetId);
          }
        });
      }
    } finally {
      setIsPhoneSubmitting(false);
    }
  };

  const handlePhoneCodeVerify = async () => {
    if (!confirmationResult) return;
    setError(null);
    setIsPhoneSubmitting(true);
    try {
      const userCredential = await confirmationResult.confirm(verificationCode);
      
      // Check if user document exists in Firestore
      if (userCredential.user) {
        const userDocRef = doc(firestore, 'users', userCredential.user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        // If user document doesn't exist, create it with the role from URL parameter
        // This only happens for NEW users logging in for the first time
        if (!userDocSnap.exists()) {
          await setDoc(userDocRef, {
            phoneNumber: userCredential.user.phoneNumber,
            role: role,
            createdAt: new Date().toISOString(),
          });
          console.log('[LoginForm] Phone login - New user registered with role:', role);
        } else {
          // Existing user - do NOT change their role
          console.log('[LoginForm] Phone login - Existing user, keeping role:', userDocSnap.data()?.role);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify code.');
    } finally {
      setIsPhoneSubmitting(false);
    }
  };

  const isSubmitting = isEmailSubmitting || isGoogleSubmitting || isPhoneSubmitting;

  return (
    <div className="grid gap-6">
       <div id="recaptcha-container"></div>
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Login Failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="email" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="phone">Phone</TabsTrigger>
        </TabsList>
        <TabsContent value="email">
            <form onSubmit={handleEmailLogin} className="grid gap-4 pt-4">
                <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    disabled={isSubmitting}
                />
                </div>
                <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required disabled={isSubmitting} />
                </div>
                <Button type="submit" className="w-full" disabled={isEmailSubmitting}>
                {isEmailSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In with Email
                </Button>
            </form>
        </TabsContent>
        <TabsContent value="phone">
            <div className="grid gap-4 pt-4">
                {!confirmationResult ? (
                     <form onSubmit={handlePhoneCodeSend} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Phone Number</Label>
                             <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <span className="text-muted-foreground sm:text-sm">+91</span>
                                </div>
                                <Input
                                    type="tel"
                                    name="phone"
                                    id="phone"
                                    placeholder="98765 43210"
                                    className="pl-12"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                    maxLength={10}
                                    disabled={isSubmitting}
                                />
                             </div>
                        </div>
                        <Button type="submit" className="w-full" disabled={isPhoneSubmitting || phone.length !== 10}>
                            {isPhoneSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Send Verification Code
                        </Button>
                    </form>
                ) : (
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="code">Verification Code</Label>
                            <Input
                                id="code"
                                name="code"
                                type="text"
                                placeholder="123456"
                                required
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>
                        <Button onClick={handlePhoneCodeVerify} className="w-full" disabled={isPhoneSubmitting || !verificationCode}>
                            {isPhoneSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Verify & Sign In
                        </Button>
                         <Button variant="link" size="sm" onClick={() => { setConfirmationResult(null); setError(null); }} disabled={isSubmitting}>
                            Back
                        </Button>
                    </div>
                )}
            </div>
        </TabsContent>
      </Tabs>

      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={isGoogleSubmitting}>
        {isGoogleSubmitting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <GoogleIcon className="mr-2 h-5 w-5" />
        )}
        Sign In with Google
      </Button>
    </div>
  );
}
