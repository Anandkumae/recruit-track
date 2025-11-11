
'use client';

import { useParams, notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Briefcase, Calendar, CheckCircle, User as UserIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import jobs from '@/lib/jobs.json';
import { users } from '@/lib/data';
import type { Job } from '@/lib/types';

// This is a temporary type definition until the main types are updated
type StaticJob = Omit<Job, 'createdAt'> & {
  id: string;
  createdAt: string;
};

export default function JobDetailsPage() {
    const params = useParams();
    const id = params.id as string;
    
    // Find the job from the local JSON file
    const job = (jobs as StaticJob[]).find(j => j.id === id);
    
    // Find the poster's details from the local data file
    const poster = users.find(u => u.id === job?.postedBy);

    if (!job) {
        notFound();
    }
    
    const formatDate = (dateString: string) => {
        try {
            const date = parseISO(dateString);
            return format(date, 'MMM d, yyyy');
        } catch {
            return 'Invalid Date';
        }
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
