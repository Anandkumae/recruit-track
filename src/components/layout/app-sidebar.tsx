'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Briefcase } from 'lucide-react';
import { useUser } from '@/firebase';
import { cn } from '@/lib/utils';
import { navItems, users as mockUsers } from '@/lib/data'; // We'll get user roles from mock data for now
import type { Role } from '@/lib/types';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useUser();

  if (!user) {
    return null;
  }
  
  // This is a temporary solution. In a real app, you'd get the user's role
  // from custom claims or a Firestore document.
  // For now, let's assume the first user is an admin for demo purposes.
  // We'll give the anonymous user an 'HR' role to see most of the nav items.
  const userRole: Role = 'HR';

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
                isActive={pathname === item.href}
                className={cn(
                  'w-full justify-start',
                  pathname.startsWith(item.href) && item.href !== '/dashboard'
                    ? 'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary'
                    : '',
                    pathname === item.href && item.href === '/dashboard' ? 'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary' : ''
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
