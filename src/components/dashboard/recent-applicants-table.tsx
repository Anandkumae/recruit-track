
'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { updateCandidateStatus, type UpdateCandidateStatusState } from '@/lib/actions';
import type { Candidate, WithId } from '@/lib/types';
import { Check, Loader2 } from 'lucide-react';
import React from 'react';

const getInitials = (name: string) => (name ? name.split(' ').map(n => n[0]).join('') : '');

function ShortlistButton({ candidateId }: { candidateId: string }) {
  const { pending } = useFormStatus();

  return (
    <Button size="sm" variant="outline" type="submit" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
      Shortlist
    </Button>
  );
}

function ShortlistForm({ candidate }: { candidate: WithId<Candidate> }) {
  const { toast } = useToast();
  const [state, formAction] = useActionState<UpdateCandidateStatusState, FormData>(updateCandidateStatus, {});

  React.useEffect(() => {
    if (state.success) {
      toast({
        title: 'Candidate Updated',
        description: state.message,
      });
    } else if (state.errors?._form) {
      toast({
        title: 'Error',
        description: state.errors._form[0],
        variant: 'destructive',
      });
    }
  }, [state, toast]);

  return (
    <form action={formAction}>
      <input type="hidden" name="candidateId" value={candidate.id} />
      <input type="hidden" name="status" value="Shortlisted" />
      <ShortlistButton candidateId={candidate.id} />
    </form>
  );
}

interface RecentApplicantsTableProps {
  candidates: WithId<Candidate>[];
  jobsMap: Map<string, string>;
}

export function RecentApplicantsTable({ candidates, jobsMap }: RecentApplicantsTableProps) {
  if (candidates.length === 0) {
    return <p className="text-center text-sm text-muted-foreground py-8">No new applicants found.</p>;
  }

  return (
    <div className="space-y-4">
      {candidates.map(candidate => (
        <div key={candidate.id} className="flex items-center justify-between">
          <Link href={`/candidates/${candidate.id}`} className="flex items-center gap-3 group">
            <Avatar className="h-9 w-9">
              <AvatarImage src={candidate.avatarUrl} alt={candidate.name} />
              <AvatarFallback>{getInitials(candidate.name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm group-hover:underline">{candidate.name}</p>
              <p className="text-xs text-muted-foreground">{jobsMap.get(candidate.jobAppliedFor) || 'Unknown Job'}</p>
            </div>
          </Link>
          {candidate.status === 'Applied' && <ShortlistForm candidate={candidate} />}
          {candidate.status === 'Shortlisted' && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Check className="h-4 w-4" />
              <span>Shortlisted</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
