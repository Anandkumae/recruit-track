'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Check, ArrowLeft } from 'lucide-react';

export default function BasicPlanPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky inset-x-0 top-4 z-50 mx-auto max-w-5xl">
        <nav className="flex items-center justify-between rounded-full border bg-background/95 p-2 shadow-sm backdrop-blur-sm lg:px-4">
           <Link href="/" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary">
              <ArrowLeft className="h-4 w-4" /> Back to Home
           </Link>
        </nav>
      </header>
      <main className="flex-1 py-20">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">
              Get Started with the Basic Plan
            </h1>
            <p className="mt-4 text-xl text-muted-foreground">
              Perfect for individuals and small teams just starting their hiring journey.
            </p>
          </div>

          <div className="mx-auto mt-12 max-w-lg rounded-xl border bg-card p-8 shadow-lg">
            <div className="text-center">
              <h2 className="text-2xl font-bold">Basic</h2>
              <p className="mt-2 text-4xl font-extrabold">Free</p>
              <p className="text-sm text-muted-foreground">Forever</p>
            </div>
            
            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <span>1 active job post</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <span>Basic candidate tracking</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <span>Community support</span>
              </div>
            </div>

            <div className="mt-8">
              <Button className="w-full" size="lg" asChild>
                <Link href="/signup?plan=basic">Create Free Account</Link>
              </Button>
              <p className="mt-4 text-center text-xs text-muted-foreground">
                No credit card required.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
