
'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { getMatch, type MatcherState } from '@/lib/actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Wand2, Users, User } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Candidate, WithId } from '@/lib/types';
import { collection, query, orderBy } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  const firestore = useFirestore();

  const candidatesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'candidates'), orderBy('name', 'asc'));
  }, [firestore]);

  const { data: candidates, isLoading: candidatesLoading } = useCollection<WithId<Candidate>>(candidatesQuery);

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
            Select a candidate and provide the job description to analyze.
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
              <Label htmlFor="candidateId">Select Candidate</Label>
              <Select name="candidateId">
                <SelectTrigger>
                  <SelectValue placeholder={
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4"/>
                      <span>Select a candidate...</span>
                    </div>
                  } />
                </SelectTrigger>
                <SelectContent>
                  {candidatesLoading ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  ) : (
                    candidates?.map((candidate) => (
                      <SelectItem key={candidate.id} value={candidate.id}>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{candidate.name}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {state.errors?.candidateId && <p className="text-sm font-medium text-destructive">{state.errors.candidateId[0]}</p>}
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
