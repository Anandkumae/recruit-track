
'use client';

import { useDoc, useFirestore, useMemoFirebase, useFirebase, useUser, useCollection } from "@/firebase";
import type { Candidate, Job, WithId, Role, User } from "@/lib/types";
import { notFound, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AtSign, Briefcase, Calendar, CheckCircle, Eye, FileText, Loader2, Phone, Clock, MapPin, Link as LinkIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { HiringStage } from "@/lib/types";
import { doc, collection, query, where, orderBy } from 'firebase/firestore';
import React, { useState, useEffect } from 'react';
import { ref, getDownloadURL } from 'firebase/storage';
import type { FirebaseStorage } from 'firebase/storage';
import { scheduleInterview, type ScheduleInterviewState } from '@/lib/actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useActionState } from 'react';


const getInitials = (name: string) => {
    return name ? name.split(' ').map(n => n[0]).join('') : '';
}

const statusColors: Record<HiringStage, string> = {
    Applied: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    Shortlisted: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    'Interview Scheduled': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    Interviewed: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    Hired: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    Rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

function ResumeSection({ resumeUrl, storage }: { resumeUrl?: string, storage: FirebaseStorage | null }) {
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

function InterviewSchedulingSection({ candidateId, candidateName, jobTitle, isOwner, employerId }: { candidateId: string, candidateName: string, jobTitle: string, isOwner: boolean, employerId?: string }) {
    const { user } = useUser();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [state, formAction] = useActionState<ScheduleInterviewState, FormData>(scheduleInterview, { candidateId });
    const [interviews, setInterviews] = useState<WithId<Interview>[]>([]);
    const [interviewsLoading, setInterviewsLoading] = useState(true);

    // Check if user is admin or employer
    const isAdminUser = user?.email === 'anandkumar.shinnovationco@gmail.com';
    const isEmployer = user?.uid === employerId;

    type Interview = {
        id: string;
        candidateId: string;
        scheduledAt: any;
        location?: string;
        meetingLink?: string;
        notes?: string;
        status: 'Scheduled' | 'Completed' | 'Cancelled' | 'Rescheduled';
    };

    const formatDateTime = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            return format(date, 'MMM d, yyyy h:mm a');
        } catch {
            return 'Invalid Date';
        }
    };

    useEffect(() => {
        let mounted = true;
        
        async function fetchInterviews() {
            if (!candidateId || (!isAdminUser && !isOwner && !isEmployer)) return;
            
            setInterviewsLoading(true);
            try {
                const { getInterviewsAction } = await import('@/lib/actions');
                const result = await getInterviewsAction(candidateId);
                
                if (mounted && result.interviews) {
                    setInterviews(result.interviews as WithId<Interview>[]);
                }
            } catch (error) {
                console.error("Failed to load interviews:", error);
            } finally {
                if (mounted) setInterviewsLoading(false);
            }
        }

        fetchInterviews();

        return () => { mounted = false; };
    }, [candidateId, isAdminUser, isOwner, isEmployer, state?.success]);

    useEffect(() => {
        if (state?.success) {
            setIsDialogOpen(false);
        }
    }, [state?.success]);
    
    if (!isAdminUser && !isOwner && !isEmployer) return null;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Interview Scheduling</CardTitle>
                        <CardDescription>
                            {(isAdminUser || isEmployer)
                                ? "Schedule and manage interviews for this candidate." 
                                : "View your scheduled interviews."}
                        </CardDescription>
                    </div>
                    {(isAdminUser || isEmployer) && (
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Schedule Interview
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>Schedule Interview</DialogTitle>
                                    <DialogDescription>
                                        Schedule an interview for {candidateName} for the position: {jobTitle}
                                    </DialogDescription>
                                </DialogHeader>
                                <form action={formAction} className="space-y-4">
                                    <input type="hidden" name="candidateId" value={candidateId} />
                                    <input type="hidden" name="scheduledBy" value={user?.uid || ''} />
                                    <input type="hidden" name="scheduledByName" value={user?.email || ''} />
                                    
                                    {state?.errors?._form && (
                                        <Alert variant="destructive">
                                            <AlertDescription>{state.errors._form[0]}</AlertDescription>
                                        </Alert>
                                    )}

                                    <div className="space-y-2">
                                        <Label htmlFor="scheduledAt">Date & Time *</Label>
                                        <Input
                                            id="scheduledAt"
                                            name="scheduledAt"
                                            type="datetime-local"
                                            required
                                            className={state?.errors?.scheduledAt ? 'border-red-500' : ''}
                                        />
                                        {state?.errors?.scheduledAt && (
                                            <p className="text-sm text-red-500">{state.errors.scheduledAt[0]}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="location">Location</Label>
                                        <Input
                                            id="location"
                                            name="location"
                                            placeholder="e.g., Conference Room A, Zoom, etc."
                                            className={state?.errors?.location ? 'border-red-500' : ''}
                                        />
                                        {state?.errors?.location && (
                                            <p className="text-sm text-red-500">{state.errors.location[0]}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="meetingLink">Meeting Link</Label>
                                        <Input
                                            id="meetingLink"
                                            name="meetingLink"
                                            type="url"
                                            placeholder="https://zoom.us/j/..."
                                            className={state?.errors?.meetingLink ? 'border-red-500' : ''}
                                        />
                                        {state?.errors?.meetingLink && (
                                            <p className="text-sm text-red-500">{state.errors.meetingLink[0]}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="notes">Notes</Label>
                                        <Textarea
                                            id="notes"
                                            name="notes"
                                            placeholder="Additional notes about the interview..."
                                            rows={3}
                                            className={state?.errors?.notes ? 'border-red-500' : ''}
                                        />
                                        {state?.errors?.notes && (
                                            <p className="text-sm text-red-500">{state.errors.notes[0]}</p>
                                        )}
                                    </div>

                                    <div className="flex justify-end gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setIsDialogOpen(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={state?.success}>
                                            {state?.success ? 'Scheduled!' : 'Schedule Interview'}
                                        </Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {interviewsLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                ) : interviews && interviews.length > 0 ? (
                    <div className="space-y-3">
                        {interviews.map((interview) => (
                            <div
                                key={interview.id}
                                className="border rounded-lg p-4 space-y-2"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1 flex-1">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium">
                                                {formatDateTime(interview.scheduledAt)}
                                            </span>
                                            <Badge
                                                variant={
                                                    interview.status === 'Scheduled'
                                                        ? 'default'
                                                        : interview.status === 'Completed'
                                                        ? 'secondary'
                                                        : 'destructive'
                                                }
                                            >
                                                {interview.status}
                                            </Badge>
                                        </div>
                                        {interview.location && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <MapPin className="h-3 w-3" />
                                                {interview.location}
                                            </div>
                                        )}
                                        {interview.meetingLink && (
                                            <div className="flex items-center gap-2">
                                                <LinkIcon className="h-3 w-3 text-muted-foreground" />
                                                <a
                                                    href={interview.meetingLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-primary hover:underline"
                                                >
                                                    Join Meeting
                                                </a>
                                            </div>
                                        )}
                                        {interview.notes && (
                                            <p className="text-sm text-muted-foreground mt-2">
                                                {interview.notes}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                        No interviews scheduled yet.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

function CandidateDetailsView({ candidate, job }: { candidate: WithId<Candidate>, job: WithId<Job> | null}) {
    const { storage, user } = useFirebase();
    const isOwner = user?.uid === candidate.userId;
    
    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            return format(date, 'MMM d, yyyy');
        } catch {
            return 'Invalid Date';
        }
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
                            <CardTitle>Application Details</CardTitle>
                            <CardDescription>Why this candidate is interested in the role</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="text-sm font-medium mb-2">Cover Letter</h4>
                                <p className="text-sm text-foreground/80 whitespace-pre-wrap bg-muted/30 p-4 rounded-md">
                                    {candidate.applicationDescription || 'No application description provided.'}
                                </p>
                            </div>
                            {candidate.requiredTimePeriod && (
                                <div>
                                    <h4 className="text-sm font-medium mb-2">Notice Period / Availability</h4>
                                    <p className="text-sm text-foreground/80">
                                        {candidate.requiredTimePeriod}
                                    </p>
                                </div>
                            )}
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
                    
                    {(user?.email === 'anandkumar.shinnovationco@gmail.com' || isOwner || user?.uid === candidate.employerId) && (
                        <InterviewSchedulingSection
                            candidateId={candidate.id}
                            candidateName={candidate.name}
                            jobTitle={job?.title || 'Unknown Job'}
                            isOwner={isOwner}
                            employerId={candidate.employerId}
                        />
                    )}
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
                                 <Badge className={cn("border-transparent", statusColors[candidate.status as HiringStage])}>
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
    );
}

export default function CandidateDetailsPage() {
    const params = useParams();
    const id = params.id as string;
    const { firestore } = useFirebase();
    const { user, isUserLoading } = useUser();
    const privilegedRoles: Role[] = ["Admin", "HR", "Manager"];

    const candidateRef = useMemoFirebase(() => {
        if (!firestore || !id) return null;
        return doc(firestore, 'candidates', id);
    }, [firestore, id]);

    const { data: candidate, isLoading: candidateLoading, error: candidateError } = useDoc<WithId<Candidate>>(candidateRef);
    
    const jobRef = useMemoFirebase(() => {
        if (!firestore || !candidate?.jobAppliedFor) return null;
        return doc(firestore, 'jobs', candidate.jobAppliedFor);
    }, [firestore, candidate?.jobAppliedFor]);

    const { data: job, isLoading: jobLoading, error: jobError } = useDoc<WithId<Job>>(jobRef);

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);

    const { data: userProfile, isLoading: userProfileLoading } = useDoc<WithId<User>>(userProfileRef);

    const userRole: Role =
        user?.email === 'anandkumar.shinnovationco@gmail.com'
            ? 'Admin'
            : userProfile?.role || 'Candidate';

    const rolesAdminDocRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'roles_admin', user.uid);
    }, [firestore, user]);

    const { data: rolesAdminDoc, isLoading: rolesAdminLoading } = useDoc<WithId<Record<string, unknown>>>(rolesAdminDocRef);

    const isListedAdmin = Boolean(rolesAdminDoc);
    const isPrivilegedUser = isListedAdmin || privilegedRoles.includes(userRole);
    
    const isOwner = user?.uid === candidate?.userId;
    
    const isLoading =
        isUserLoading ||
        candidateLoading ||
        userProfileLoading ||
        rolesAdminLoading ||
        (candidate && !job && jobLoading);
    
    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="sr-only">Loading candidate details...</span>
            </div>
        );
    }
    
    // Let privileged roles see any profile, and users see their own application
    if (!candidate || (!isPrivilegedUser && !isOwner)) {
        notFound();
    }

    return (
        <CandidateDetailsView candidate={candidate} job={job || null} />
    );
}
