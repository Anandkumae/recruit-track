import Link from "next/link";
import { notFound } from "next/navigation";
import { Briefcase } from "lucide-react";
import { ApplyForm } from "@/components/apply/apply-form";
import { jobs } from "@/lib/data";

export default function ApplyPage({ params }: { params: { jobId: string } }) {
  const job = jobs.find((j) => j.id === params.jobId);

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
