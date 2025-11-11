
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Briefcase } from 'lucide-react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { cn } from '@/lib/utils';
import { navItems } from '@/lib/data';
import type { Role, WithId, User } from '@/lib/types';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar
} from '@/components/ui/sidebar';
import { doc } from 'firebase/firestore';

function SidebarItem({ item }: { item: (typeof navItems)[0] }) {
    const pathname = usePathname();
    const { isMobile, setOpen } = useSidebar();

    const handleClick = () => {
        if (isMobile) {
            setOpen(false);
        }
    }
    
    return (
         <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                variant="default"
                isActive={pathname.startsWith(item.href)}
                className={cn(
                  'w-full justify-start'
                )}
                tooltip={item.label}
                onClick={handleClick}
              >
                <Link href={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
    )
}

export function AppSidebar() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { isMobile, setOpen } = useSidebar();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile } = useDoc<WithId<User>>(userProfileRef);

  if (!user) {
    return null;
  }
  
  let userRole: Role = 'Candidate'; // Default to the most restrictive role

  if (user.email === 'anandkumar.shinnovationco@gmail.com') {
    userRole = 'Admin';
  } else if (userProfile?.role) {
    userRole = userProfile.role;
  }


  const allowedNavItems = navItems.filter((item) => {
    return item.roles.includes(userRole);
  });

   const handleLinkClick = () => {
    if (!isMobile) {
      setOpen(false);
    }
   };

  return (
    <Sidebar className="border-r" side="left" collapsible="icon">
      <SidebarHeader className='p-2 flex items-center justify-between'>
        <SidebarMenuButton asChild variant="ghost" className="w-full justify-start h-10 px-2 text-lg font-semibold">
           <Link href="/dashboard" className="flex items-center gap-2">
            <Briefcase className="h-7 w-7 text-primary" />
            <span className="text-lg font-semibold text-foreground">
              LeoRecruit
            </span>
          </Link>
        </SidebarMenuButton>
        <SidebarTrigger className="hidden md:flex" />
      </SidebarHeader>
      <SidebarContent className="p-2" onClick={handleLinkClick}>
        <SidebarMenu>
          {allowedNavItems.map((item) => (
           <SidebarItem key={item.href} item={item} />
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
