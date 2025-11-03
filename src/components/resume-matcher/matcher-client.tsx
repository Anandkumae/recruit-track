'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { getMatch, type MatcherState } from '@/lib/actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Wand2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...
        </>
      ) : (
        <>
          <Wand2 className="mr-2 h-4 w-4" /> Get Match Score
        </>
      )}
    </Button>
  );
}

export function MatcherClient() {
  const initialState: MatcherState = {};
  const [state, dispatch] = useActionState(getMatch, initialState);
  const { toast } = useToast();
  
  useEffect(() => {
    if(state.message && state.result) {
        toast({
            title: "Analysis Complete",
            description: "Resume match score has been generated.",
        });
    } else if (state.errors?._form) {
        toast({
            title: "Error",
            description: state.errors._form[0],
            variant: 'destructive'
        })
    }
  }, [state, toast]);

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Input Details</CardTitle>
          <CardDescription>
            Provide the resume text and the job description below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={dispatch} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="jobDescription">Job Description</Label>
              <Textarea
                id="jobDescription"
                name="jobDescription"
                placeholder="Paste the full job description here..."
                rows={8}
              />
               {state.errors?.jobDescription && <p className="text-sm font-medium text-destructive">{state.errors.jobDescription[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="resume">Candidate's Resume</Label>
              <Textarea
                id="resume"
                name="resume"
                placeholder="Paste the full text of the candidate's resume here..."
                rows={12}
              />
              {state.errors?.resume && <p className="text-sm font-medium text-destructive">{state.errors.resume[0]}</p>}
            </div>
            <SubmitButton />
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI Match Analysis</CardTitle>
          <CardDescription>
            The AI-powered analysis of the match will appear here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {state.result ? (
            <div className="space-y-4">
              <div>
                <div className="flex items-baseline justify-between">
                  <Label>Match Score</Label>
                  <span className="text-2xl font-bold text-primary">
                    {state.result.matchScore}
                    <span className="text-sm text-muted-foreground">/100</span>
                  </span>
                </div>
                <Progress value={state.result.matchScore} className="mt-2" />
              </div>
              <div>
                <Label>Reasoning</Label>
                <p className="mt-1 text-sm text-foreground/80 rounded-md border bg-muted/50 p-3">
                  {state.result.reasoning}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
              <p className="text-center text-muted-foreground">
                Results will be displayed here after analysis.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
