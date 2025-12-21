
'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { Loader2 } from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { doc } from 'firebase/firestore';
import type { User, WithId } from '@/lib/types';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<WithId<User>>(userProfileRef);

  React.useEffect(() => {
    // Check if account is being deleted - if so, don't redirect
    if (typeof window !== 'undefined' && localStorage.getItem('accountDeleting') === 'true') {
      return;
    }
    
    if (isUserLoading) {
      // Still waiting for auth data, do nothing yet.
      return;
    }

    if (!user) {
      // No user, redirect to login
      router.replace('/login');
      return;
    }
    
    // For all users, wait until the profile has finished loading
    if (isProfileLoading) {
      return;
    }
    
    // User is logged in, now check for profile (unless they have Admin role)
    const isAdmin = userProfile?.role === 'Admin';
    if (isAdmin) {
      if (pathname === '/create-profile') {
        router.replace('/dashboard');
      }
      return; // Admin doesn't need a user profile, so skip further checks
    }

    // Now we know the user exists and their profile has been checked
    if (!userProfile && pathname !== '/create-profile' && !pathname.startsWith('/apply/')) {
      // User has no profile, redirect to create one, but allow them to access apply pages
      router.replace('/create-profile');
      return;
    }

    if (userProfile && pathname === '/create-profile') {
      // User has a profile but is on the create-profile page, redirect to dashboard
      router.replace('/dashboard');
    }
  }, [user, isUserLoading, userProfile, isProfileLoading, router, pathname]);

  const isLoading = isUserLoading || (user && isProfileLoading && !pathname.startsWith('/apply/'));
  
  if (pathname === '/create-profile' || pathname.startsWith('/apply/')) {
    // Render these pages within a simpler layout, or just the children directly
    // This avoids forcing a full dashboard layout before a profile exists.
    return <>{children}</>;
  }

  if (isLoading || !user) {
     return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <AppHeader userProfile={userProfile}/>
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
