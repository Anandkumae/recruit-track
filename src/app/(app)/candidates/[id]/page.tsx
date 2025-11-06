
import { candidates, jobs } from "@/lib/data";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AtSign, Briefcase, Calendar, CheckCircle, Download, FileText, Phone, Star } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { HiringStage } from "@/lib/types";

const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('');
}

const statusColors: Record<HiringStage, string> = {
    Applied: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    Shortlisted: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    Interviewed: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    Hired: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    Rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};


export default function CandidateDetailsPage({ params }: { params: { id: string } }) {
    const candidate = candidates.find(c => c.id === params.id);

    if (!candidate) {
        notFound();
    }

    const job = jobs.find(j => j.id === candidate.jobAppliedFor);

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/candidates">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                        <AvatarImage src={candidate.avatarUrl} alt={candidate.name} />
                        <AvatarFallback className="text-2xl">{getInitials(candidate.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{candidate.name}</h1>
                        <p className="text-muted-foreground">Applying for {job?.title || 'Unknown Job'}</p>
                    </div>
                </div>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>AI Match Analysis</CardTitle>
                             <CardDescription>
                                AI analysis of the candidate's resume against the job description.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div>
                                <div className="flex items-baseline justify-between">
                                  <span className="text-sm font-medium">Match Score</span>
                                  <span className="text-xl font-bold text-primary">
                                    {candidate.matchScore}
                                    <span className="text-xs text-muted-foreground">/100</span>
                                  </span>
                                </div>
                                <Progress value={candidate.matchScore} className="mt-2" />
                              </div>
                              <div>
                                <span className="text-sm font-medium">AI Reasoning</span>
                                <p className="mt-1 text-sm text-foreground/80 rounded-md border bg-muted/50 p-3">
                                  {candidate.matchReasoning}
                                </p>
                              </div>
                        </CardContent>
                    </Card>

                    {candidate.resumeText && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Resume Text</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <pre className="text-sm text-foreground/80 whitespace-pre-wrap font-sans bg-muted/50 p-4 rounded-md">
                                    {candidate.resumeText}
                                </pre>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle>Skills</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-2">
                             {candidate.skills.map(skill => (
                                <Badge key={skill} variant="secondary">{skill}</Badge>
                            ))}
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Candidate Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="flex items-center gap-2">
                                <AtSign className="h-4 w-4 text-muted-foreground" />
                                <a href={`mailto:${candidate.email}`} className="text-sm hover:underline">{candidate.email}</a>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{candidate.phone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">Applied on {format(parseISO(candidate.appliedAt), 'MMM d, yyyy')}</span>
                            </div>
                             <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                                 <Badge className={cn("border-transparent", statusColors[candidate.status])}>
                                    {candidate.status}
                                </Badge>
                            </div>
                             {job && (
                                <div className="flex items-center gap-2">
                                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                                    <Link href={`/jobs/${job.id}`} className="text-sm hover:underline">{job.title}</Link>
                                </div>
                             )}
                        </CardContent>
                    </Card>
                    
                    {candidate.resumeUrl && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Resume File</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Button asChild className="w-full">
                                    <Link href={candidate.resumeUrl} target="_blank">
                                        <Download className="mr-2 h-4 w-4" />
                                        Download Resume
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
