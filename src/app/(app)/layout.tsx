'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { Loader2 } from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { doc } from 'firebase/firestore';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  React.useEffect(() => {
    if (isUserLoading || isProfileLoading) {
      // Still waiting for auth or profile data
      return;
    }

    if (!user) {
      // No user, redirect to login
      router.replace('/login');
      return;
    }

    // Check if the user is the special admin
    const isAdmin = user.email === 'anandkumar.shinnovationco@gmail.com';

    // If the user is the admin, don't force profile creation
    if (isAdmin) {
      if (pathname === '/create-profile') {
        router.replace('/dashboard');
      }
      return; // Skip profile check for admin
    }

    if (!userProfile && pathname !== '/create-profile') {
      // User is logged in but has no profile, redirect to create one
      router.replace('/create-profile');
      return;
    }

    if (userProfile && pathname === '/create-profile') {
      // User has a profile but is on the create-profile page, redirect to dashboard
      router.replace('/dashboard');
    }
  }, [user, isUserLoading, userProfile, isProfileLoading, router, pathname]);

  const isLoading = isUserLoading || (user && isProfileLoading && user.email !== 'anandkumar.shinnovationco@gmail.com');
  
  if (isLoading || !user) {
     return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!userProfile && pathname !== '/create-profile' && user.email !== 'anandkumar.shinnovationco@gmail.com') {
     // Still loading or redirecting
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (pathname === '/create-profile') {
    // Admins shouldn't be on the create-profile page
    if (user.email === 'anandkumar.shinnovationco@gmail.com') {
        return (
          <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )
    }
    return <>{children}</>;
  }


  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <AppHeader />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
