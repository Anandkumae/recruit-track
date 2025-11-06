'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Briefcase } from 'lucide-react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { cn } from '@/lib/utils';
import { navItems } from '@/lib/data';
import type { Role } from '@/lib/types';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { doc } from 'firebase/firestore';

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile } = useDoc(userProfileRef);

  if (!user) {
    return null;
  }
  
  // This is a temporary solution. In a real app, you'd get the user's role
  // from custom claims or a Firestore document.
  let userRole: Role = userProfile?.role || 'Candidate';
  if (user.email === 'anandkumar.shinnovationco@gmail.com') {
    userRole = 'Admin';
  }


  const allowedNavItems = navItems.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <Sidebar className="border-r" side="left">
      <SidebarHeader>
        <Link href="/dashboard" className="flex items-center gap-2">
          <Briefcase className="h-7 w-7 text-primary" />
          <span className="text-lg font-semibold text-foreground">
            RecruitTrack
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {allowedNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                variant="default"
                isActive={pathname.startsWith(item.href)}
                className={cn(
                  'w-full justify-start'
                )}
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
