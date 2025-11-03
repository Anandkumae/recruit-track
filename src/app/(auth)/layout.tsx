import Image from "next/image";
import Link from "next/link";
import { Briefcase } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
            <Briefcase className="h-7 w-7" />
            RecruitTrack
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
