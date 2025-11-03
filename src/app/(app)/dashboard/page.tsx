import { StatCard } from '@/components/dashboard/stat-card';
import { OverviewChart } from '@/components/dashboard/overview-chart';
import { jobs, candidates } from '@/lib/data';
import { Briefcase, Users, UserCheck, UserPlus } from 'lucide-react';

export default function DashboardPage() {
  const totalJobs = jobs.length;
  const totalCandidates = candidates.length;
  const hiredCandidates = candidates.filter(c => c.status === 'Hired').length;
  const shortlistedCandidates = candidates.filter(c => c.status === 'Shortlisted').length;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          An overview of your recruitment process.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Jobs"
          value={totalJobs}
          icon={Briefcase}
          description="Number of open and closed positions."
        />
        <StatCard
          title="Total Candidates"
          value={totalCandidates}
          icon={Users}
          description="Total number of applicants in the system."
        />
        <StatCard
          title="Shortlisted"
          value={shortlistedCandidates}
          icon={UserPlus}
          description="Candidates moved to the next stage."
          color="bg-blue-500"
        />
        <StatCard
          title="Hired Candidates"
          value={hiredCandidates}
          icon={UserCheck}
          description="Successful hires this cycle."
          color="bg-green-500"
        />
      </div>

      <div className="grid grid-cols-1 gap-8">
          <OverviewChart />
      </div>
    </div>
  );
}
