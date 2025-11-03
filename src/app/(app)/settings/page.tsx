import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and application settings.
        </p>
      </div>

      <Card>
          <CardHeader>
            <CardTitle>Under Construction</CardTitle>
            <CardDescription>This page is currently under development.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>More settings and profile management options will be available here in a future update.</p>
          </CardContent>
      </Card>
    </div>
  );
}
