import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function CreateJobPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
            <Link href="/jobs">
                <ArrowLeft className="h-4 w-4" />
            </Link>
        </Button>
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Create New Job</h1>
            <p className="text-muted-foreground">
            Fill in the details to post a new job opening.
            </p>
        </div>
      </div>

      <Card>
          <CardHeader>
            <CardTitle>Under Construction</CardTitle>
            <CardDescription>This form is currently under development.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>The job creation form will be available here in a future update. For now, please enjoy the demo data.</p>
          </CardContent>
      </Card>
    </div>
  );
}
