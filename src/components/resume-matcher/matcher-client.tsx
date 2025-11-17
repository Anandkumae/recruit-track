
'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { getMatch, type MatcherState } from '@/lib/actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Wand2, FileUp, Sparkles } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';

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
            Upload a resume and provide the job description to analyze.
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
                required
              />
               {state.errors?.jobDescription && <p className="text-sm font-medium text-destructive">{state.errors.jobDescription[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="resumeFile">Upload Resume</Label>
               <div className="flex items-center gap-2 rounded-md border border-input px-3 py-2">
                  <FileUp className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="resumeFile"
                    name="resumeFile"
                    type="file"
                    className="flex-1 border-0 p-0 h-auto file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-0 focus-visible:ring-offset-0"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    required
                  />
               </div>
              <p className="text-xs text-muted-foreground">Supported formats: PDF, PNG, JPG, WebP. Max 5MB.</p>
              {state.errors?.resumeFile && <p className="text-sm font-medium text-destructive">{state.errors.resumeFile[0]}</p>}
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
            <div className="space-y-6">
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
              {state.result.suggestedSkills && state.result.suggestedSkills.length > 0 && (
                 <div>
                    <Label className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-yellow-500" />
                      Suggested Skills to Add
                    </Label>
                    <p className="text-xs text-muted-foreground mb-2">Consider adding these skills from the job description to your resume.</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {state.result.suggestedSkills.map((skill, index) => (
                            <Badge key={index} variant="outline" className="border-green-500/50 bg-green-500/10 text-green-800 dark:text-green-300">
                                {skill}
                            </Badge>
                        ))}
                    </div>
                </div>
              )}
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
