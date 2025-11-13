
'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { rerunAiMatch, type RerunAiMatchState } from '@/lib/actions';
import { Loader2, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button size="sm" type="submit" disabled={pending}>
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Wand2 className="mr-2 h-4 w-4" />
      )}
      Re-run Analysis
    </Button>
  );
}

export function RerunAnalysis({ candidateId }: { candidateId: string }) {
  const [state, formAction] = useActionState<RerunAiMatchState, FormData>(rerunAiMatch, {});
  const { toast } = useToast();

  useEffect(() => {
    if (state.success) {
      toast({
        title: 'Success',
        description: state.message,
      });
    }
    if (state.errors?._form) {
      toast({
        title: 'Error',
        description: state.errors._form[0],
        variant: 'destructive',
      });
    }
  }, [state, toast]);

  return (
    <form action={formAction}>
      <input type="hidden" name="candidateId" value={candidateId} />
      <SubmitButton />
    </form>
  );
}
