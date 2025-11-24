import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Welcome to LeoRecruit</CardTitle>
        <CardDescription>
          Sign in to your account to continue.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
        <div className="mt-6 flex flex-col gap-2 text-center text-sm">
          <div className="text-muted-foreground">Don't have an account?</div>
          <div className="flex justify-center gap-4">
            <a href="/signup?role=employer" className="font-medium text-primary hover:underline">
              Register as Employer
            </a>
            <span className="text-muted-foreground">|</span>
            <a href="/signup?role=employee" className="font-medium text-primary hover:underline">
              Register as Employee
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
