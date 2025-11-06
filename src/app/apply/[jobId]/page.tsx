'use client';

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { Briefcase, Loader2 } from "lucide-react";
import { ApplyForm } from "@/components/apply/apply-form";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { Job } from "@/lib/types";

export default function ApplyPage() {
  const params = useParams();
  const jobId = params.jobId as string;
  const firestore = useFirestore();

  const jobRef = useMemoFirebase(() => {
    if (!firestore || !jobId) return null;
    return doc(firestore, 'jobs', jobId);
  }, [firestore, jobId]);

  const { data: job, isLoading } = useDoc<Job>(jobRef);

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-muted/40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!job) {
    notFound();
  }

  return (
    <div className="flex min-h-screen w-full justify-center bg-muted/40 p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-2xl">
        <div className="mb-8 flex justify-center">
          <Link
            href="/"
            className="flex items-center gap-2 text-2xl font-bold text-primary"
          >
            <Briefcase className="h-7 w-7" />
            RecruitTrack
          </Link>
        </div>
        <ApplyForm job={job} />
      </div>
    </div>
  );
}
