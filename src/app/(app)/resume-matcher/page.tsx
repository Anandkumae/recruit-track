import { MatcherClient } from '@/components/resume-matcher/matcher-client';

export default function ResumeMatcherPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Resume Matcher</h1>
        <p className="text-muted-foreground">
          Paste a resume and job description to get an instant match analysis.
        </p>
      </div>

      <MatcherClient />
    </div>
  );
}
