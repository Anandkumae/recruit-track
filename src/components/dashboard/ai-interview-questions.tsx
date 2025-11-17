'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getInterviewQuestions, type InterviewQuestionState } from '@/lib/actions';
import { Loader2, Wand2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="sm">
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Wand2 className="mr-2 h-4 w-4" />
      )}
      Generate Questions
    </Button>
  );
}

export function AiInterviewQuestions() {
  const initialState: InterviewQuestionState = {};
  const [state, formAction] = useActionState(getInterviewQuestions, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state.errors?._form) {
      toast({
        title: 'Error',
        description: state.errors._form[0],
        variant: 'destructive',
      });
    }
  }, [state, toast]);

  return (
    <div className="space-y-4">
      <form action={formAction} className="flex items-end gap-2">
        <div className="flex-grow space-y-1.5">
          <Label htmlFor="jobTitle" className="sr-only">
            Job Title
          </Label>
          <Input
            id="jobTitle"
            name="jobTitle"
            placeholder="e.g., Software Engineer, Product Manager..."
            required
          />
        </div>
        <SubmitButton />
      </form>

      {state.errors?.jobTitle && (
        <p className="text-sm font-medium text-destructive">{state.errors.jobTitle[0]}</p>
      )}
      
      {state.questions && state.questions.length > 0 && (
        <div className="mt-4 space-y-3 rounded-md border bg-muted/50 p-4">
            <h4 className="font-medium">Generated Questions:</h4>
            <ul className="list-decimal space-y-2 pl-5 text-sm text-foreground/90">
                {state.questions.map((question, index) => (
                    <li key={index}>{question}</li>
                ))}
            </ul>
        </div>
      )}
    </div>
  );
}
