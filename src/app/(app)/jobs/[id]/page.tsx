
'use client';

import { useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { notFound, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Briefcase, Calendar, CheckCircle, User as UserIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { doc } from "firebase/firestore";
import type { Job, User, WithId } from "@/lib/types";


export default function JobDetailsPage() {
    const params = useParams();
    const id = params.id as string;
    const firestore = useFirestore();

    const jobRef = useMemoFirebase(() => {
        if (!firestore || !id) return null;
        return doc(firestore, 'jobs', id);
    }, [firestore, id]);

    const { data: job, isLoading: jobLoading } = useDoc<WithId<Job>>(jobRef);

    const posterRef = useMemoFirebase(() => {
        if (!firestore || !job?.postedBy) return null;
        return doc(firestore, 'users', job.postedBy);
    }, [firestore, job?.postedBy]);

    const { data: poster, isLoading: posterLoading } = useDoc<User>(posterRef);
    
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

    if (jobLoading || (job && posterLoading)) {
         return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!job) {
        notFound();
    }


    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/jobs">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{job.title}</h1>
                    <p className="text-muted-foreground">{job.department}</p>
                </div>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Job Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-foreground/80 whitespace-pre-wrap">{job.description}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Requirements</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc space-y-2 pl-5 text-foreground/80">
                                {job.requirements.map((req, index) => (
                                    <li key={index}>{req}</li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Job Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="flex items-center gap-2">
                                <Briefcase className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{job.department}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">Posted on {formatDate(job.createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <UserIcon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">Posted by {poster?.name || 'Unknown'}</span>
                            </div>
                             <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                                 <Badge variant={job.status === 'Open' ? 'default' : 'secondary'}>
                                    {job.status}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                    {job.status === 'Open' && (
                         <Button asChild className="w-full">
                            <Link href={`/apply/${id}`}>Apply Now</Link>
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
