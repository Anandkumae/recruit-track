import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";
import Link from "next/link";
import { Home } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="relative w-full max-w-md">
      <Link 
        href="/" 
        className="fixed top-4 left-4 flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors z-50"
      >
        <Home className="h-4 w-4" />
        <span>Back to Homepage</span>
      </Link>
      <Card className="w-full">
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
    </div>
  );
}
