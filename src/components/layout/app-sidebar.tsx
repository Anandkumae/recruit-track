
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Briefcase } from 'lucide-react';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
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
import { doc, collection, query, orderBy, limit, type Timestamp } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type ActivityType = 'shortlisted' | 'interview_scheduled' | 'hired' | 'rejected' | 'application_received';

type ActivityNotification = {
  type: ActivityType;
  candidateId: string;
  candidateName: string;
  candidateUserId?: string;
  jobId: string;
  jobTitle: string;
  timestamp?: Timestamp | Date | string | null;
};

function getNotificationMessage(activity: ActivityNotification) {
  switch (activity.type) {
    case 'shortlisted':
      return `You have been shortlisted for ${activity.jobTitle}.`;
    case 'interview_scheduled':
      return `Interview scheduled for ${activity.jobTitle}.`;
    case 'hired':
      return `Congratulations! You are hired for ${activity.jobTitle}.`;
    case 'rejected':
      return `Update on ${activity.jobTitle}: Not selected this time.`;
    case 'application_received':
      return `Application received for ${activity.jobTitle}.`;
    default:
      return `Status update for ${activity.jobTitle}.`;
  }
}

function toDate(timestamp?: ActivityNotification['timestamp']) {
  if (!timestamp) return null;
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === 'string') {
    const parsed = new Date(timestamp);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  if ('toDate' in timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  if ('seconds' in (timestamp as Timestamp)) {
    return new Date((timestamp as Timestamp).seconds * 1000);
  }
  return null;
}

function SidebarNotifications({ userRole, userId }: { userRole: Role; userId: string }) {
  const firestore = useFirestore();

  const notificationsQuery = useMemoFirebase(() => {
    if (!firestore || userRole !== 'Candidate') return null;
    return query(
      collection(firestore, 'users', userId, 'notifications'),
      limit(5)
    );
  }, [firestore, userRole, userId]);

  const { data: notifications, isLoading } = useCollection<WithId<ActivityNotification>>(notificationsQuery);

  if (userRole !== 'Candidate') {
    return null;
  }

  return (
    <div className="mt-4 border-t border-border/60 pt-4">
      <p className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Notifications
      </p>
      {isLoading ? (
        <div className="flex items-center gap-2 px-2 py-3 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Loading updates…</span>
        </div>
      ) : notifications?.length ? (
        <ul className="mt-2 space-y-2">
          {notifications.map((notification) => {
            const time = toDate(notification.timestamp);
              
            return (
              <li
                key={notification.id}
                className="rounded-md bg-muted/50 px-3 py-2 text-xs leading-relaxed text-muted-foreground"
              >
                <p className="font-medium text-foreground">{getNotificationMessage(notification)}</p>
                {time && (
                  <span className="text-[11px] text-muted-foreground/80">
                    {formatDistanceToNow(time, { addSuffix: true })}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="px-2 py-3 text-xs text-muted-foreground">No notifications yet.</p>
      )}
    </div>
  );
}

function SidebarItem({ item }: { item: (typeof navItems)[0] }) {
    const pathname = usePathname();
    const { isMobile, setOpenMobile } = useSidebar();

    const handleClick = () => {
        if (isMobile) {
            setOpenMobile(false);
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
  const { isMobile, setOpenMobile } = useSidebar();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile } = useDoc<WithId<User>>(userProfileRef);

  if (!user) {
    return null;
  }
  
  // Determine user role from Firestore profile
  let userRole: Role = 'Candidate';
  if (userProfile?.role) {
    userRole = userProfile.role;
  }

  // Debug logging
  console.log('[AppSidebar] User email:', user.email);
  console.log('[AppSidebar] User profile role:', userProfile?.role);
  console.log('[AppSidebar] Determined user role:', userRole);

  const allowedNavItems = navItems.filter((item) => {
    return item.roles.includes(userRole);
  });

   const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
   };

  return (
    <Sidebar className="border-r" side="left" collapsible="icon">
      <SidebarHeader className='p-2 flex items-center justify-between'>
        <SidebarMenuButton asChild variant="outline" className="w-full justify-start h-10 px-2 text-lg font-semibold border-0">
           <Link href="/dashboard" className="flex items-center gap-2">
            <Briefcase className="h-7 w-7 text-primary" />
            <span className="text-lg font-semibold text-foreground">
              LeoRecruit
            </span>
          </Link>
        </SidebarMenuButton>
        <SidebarTrigger className="hidden md:flex" />
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {allowedNavItems.map((item) => (
           <SidebarItem key={item.href} item={item} />
          ))}
        </SidebarMenu>
        {userRole === 'Candidate' && (
          <SidebarNotifications userRole={userRole} userId={user.uid} />
        )}
      </SidebarContent>
    </Sidebar>
  );
}
