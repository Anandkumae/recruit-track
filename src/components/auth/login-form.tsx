'use client';

import * as React from 'react';
import { useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from 'firebase/auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PhoneInput from 'react-phone-number-input/react-hook-form-input';
import { isPossiblePhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { useForm } from 'react-hook-form';

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
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { control, handleSubmit, formState, watch } = useForm<{ phone: string }>();
  const phoneValue = watch('phone');
  
  // Phone auth state
  const [verificationCode, setVerificationCode] = React.useState('');
  const [confirmationResult, setConfirmationResult] = React.useState<ConfirmationResult | null>(null);
  const recaptchaVerifierRef = React.useRef<RecaptchaVerifier | null>(null);

  React.useEffect(() => {
    // This effect sets up the reCAPTCHA verifier. It runs only once.
    if (!recaptchaVerifierRef.current && auth) {
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
            'size': 'invisible',
            'callback': (response: any) => {
              // reCAPTCHA solved, allow signInWithPhoneNumber.
            }
        });
    }
  }, [auth]);


  const handleEmailLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google.');
    } finally {
        setIsSubmitting(false);
    }
  };

  const handlePhoneCodeSend = async (data: {phone: string}) => {
    if (!data.phone || !isPossiblePhoneNumber(data.phone)) {
        setError("Please enter a valid phone number.");
        return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      if (!recaptchaVerifierRef.current) throw new Error("reCAPTCHA not initialized.");
      const result = await signInWithPhoneNumber(auth, data.phone, recaptchaVerifierRef.current);
      setConfirmationResult(result);
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code.');
      // In case of error, you might need to reset reCAPTCHA
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.render().then((widgetId) => {
          if (typeof grecaptcha !== 'undefined' && grecaptcha.reset) {
            grecaptcha.reset(widgetId);
          }
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhoneCodeVerify = async () => {
    if (!confirmationResult) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await confirmationResult.confirm(verificationCode);
    } catch (err: any) {
      setError(err.message || 'Failed to verify code.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In with Email
                </Button>
            </form>
        </TabsContent>
        <TabsContent value="phone">
            <form onSubmit={handleSubmit(handlePhoneCodeSend)} className="grid gap-4 pt-4">
                {!confirmationResult ? (
                     <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Phone Number</Label>
                             <PhoneInput
                                name="phone"
                                control={control}
                                international
                                defaultCountry="US"
                                placeholder="Enter phone number"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={isSubmitting || !phoneValue || (phoneValue && !isPossiblePhoneNumber(phoneValue))}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Send Verification Code
                        </Button>
                    </div>
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
                        <Button onClick={handlePhoneCodeVerify} className="w-full" disabled={isSubmitting || !verificationCode}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Verify & Sign In
                        </Button>
                         <Button variant="link" size="sm" onClick={() => { setConfirmationResult(null); setError(null); }} disabled={isSubmitting}>
                            Back
                        </Button>
                    </div>
                )}
            </form>
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
      <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={isSubmitting}>
        {isSubmitting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <GoogleIcon className="mr-2 h-5 w-5" />
        )}
        Sign In with Google
      </Button>
    </div>
  );
}
