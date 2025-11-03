'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Briefcase } from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { navItems } from '@/lib/data';
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
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const allowedNavItems = navItems.filter((item) =>
    item.roles.includes(user.role)
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
