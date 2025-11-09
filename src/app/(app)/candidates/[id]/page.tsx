
'use client';

import { useDoc, useFirestore, useMemoFirebase, useFirebase } from "@/firebase";
import type { Candidate, Job, User } from "@/lib/types";
import { notFound, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AtSign, Briefcase, Calendar, CheckCircle, Eye, FileText, Loader2, Phone } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { HiringStage } from "@/lib/types";
import { doc } from 'firebase/firestore';
import React, { useState, useEffect } from 'react';
import { ref, getDownloadURL, type Storage } from 'firebase/storage';

const getInitials = (name: string) => {
    return name ? name.split(' ').map(n => n[0]).join('') : '';
}

const statusColors: Record<HiringStage, string> = {
    Applied: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    Shortlisted: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    Interviewed: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    Hired: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    Rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

function ResumeSection({ resumeUrl, storage }: { resumeUrl?: string, storage: Storage | null }) {
    const [downloadURL, setDownloadURL] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (resumeUrl && storage) {
            setIsLoading(true);
            const fileRef = ref(storage, resumeUrl);
            getDownloadURL(fileRef)
                .then((url) => setDownloadURL(url))
                .catch((error) => {
                    console.error("Error getting download URL:", error);
                    setDownloadURL(null);
                })
                .finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
            setDownloadURL(null);
        }
    }, [resumeUrl, storage]);

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading resume...</span>
            </div>
        );
    }
    
    if (downloadURL) {
        return (
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Candidate's uploaded resume</span>
                </div>
                <Button variant="outline" size="sm" asChild>
                    <Link href={downloadURL} target="_blank" rel="noopener noreferrer">
                        <Eye className="mr-2 h-4 w-4" /> View
                    </Link>
                </Button>
            </div>
        );
    }

    return <p className="text-sm text-muted-foreground">This candidate has not uploaded a resume file.</p>;
}


export default function CandidateDetailsPage() {
    const params = useParams();
    const id = params.id as string;
    const { firestore, storage } = useFirebase();

    const candidateRef = useMemoFirebase(() => {
        if (!firestore || !id) return null;
        return doc(firestore, 'candidates', id);
    }, [firestore, id]);

    const { data: candidate, isLoading: candidateLoading } = useDoc<Candidate>(candidateRef);
    
    const jobRef = useMemoFirebase(() => {
        if (!firestore || !candidate?.jobAppliedFor) return null;
        return doc(firestore, 'jobs', candidate.jobAppliedFor);
    }, [firestore, candidate?.jobAppliedFor]);

    const { data: job, isLoading: jobLoading } = useDoc<Job>(jobRef);

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        if (timestamp.toDate) {
            return format(timestamp.toDate(), 'MMM d, yyyy');
        }
        try {
            return format(new Date(timestamp), 'MMM d, yyyy');
        } catch {
            return 'Invalid Date';
        }
    }
    
    const isLoading = candidateLoading || (candidate && jobLoading);

    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!candidate) {
        notFound();
    }

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
                                {candidate.matchScore ? (
                                    <>
                                        <div className="flex items-baseline justify-between">
                                        <span className="text-sm font-medium">Match Score</span>
                                        <span className="text-xl font-bold text-primary">
                                            {candidate.matchScore}
                                            <span className="text-xs text-muted-foreground">/100</span>
                                        </span>
                                        </div>
                                        <Progress value={candidate.matchScore} className="mt-2" />
                                    </>
                                ) : <p className="text-sm text-muted-foreground">No AI match score available.</p>}
                              </div>
                              <div>
                                <span className="text-sm font-medium">AI Reasoning</span>
                                {candidate.matchReasoning ? (
                                     <p className="mt-1 text-sm text-foreground/80 rounded-md border bg-muted/50 p-3">
                                        {candidate.matchReasoning}
                                     </p>
                                ) : <p className="text-sm text-muted-foreground mt-1">No AI reasoning available.</p>}
                              </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Skills</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-2">
                             {candidate.skills && candidate.skills.length > 0 ? candidate.skills.map(skill => (
                                <Badge key={skill} variant="secondary">{skill}</Badge>
                            )) : <p className="text-sm text-muted-foreground">No skills listed.</p>}
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader>
                            <CardTitle>Resume</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ResumeSection resumeUrl={candidate.resumeUrl} storage={storage} />
                            
                             {candidate.resumeText && (
                                <div>
                                    <h4 className="text-sm font-medium mb-2">Pasted Resume Text</h4>
                                    <p className="text-sm text-foreground/80 whitespace-pre-wrap font-mono bg-muted/50 p-4 rounded-md">
                                        {candidate.resumeText}
                                    </p>
                                </div>
                             )}
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
                                <span className="text-sm">{candidate.phone || 'Not Provided'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">Applied on {formatDate(candidate.appliedAt)}</span>
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
                </div>
            </div>
        </div>
    )
}
