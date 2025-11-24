'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Check, ArrowLeft } from 'lucide-react';

export default function ProPlanPage() {
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
              Upgrade to Pro
            </h1>
            <p className="mt-4 text-xl text-muted-foreground">
              Supercharge your hiring with AI and advanced analytics.
            </p>
          </div>

          <div className="mx-auto mt-12 max-w-lg rounded-xl border-2 border-primary bg-card p-8 shadow-xl relative">
             <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 rounded-full bg-primary px-4 py-1 text-sm font-semibold text-primary-foreground">
              Recommended
            </div>
            <div className="text-center mt-4">
              <h2 className="text-2xl font-bold">Pro</h2>
              <p className="mt-2 text-4xl font-extrabold">₹4,999<span className="text-lg font-normal text-muted-foreground">/mo</span></p>
              <p className="text-sm text-muted-foreground">Billed monthly</p>
            </div>
            
            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <span>10 active job posts</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <span>AI resume matching</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <span>Recruitment analytics</span>
              </div>
               <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <span>Email support</span>
              </div>
            </div>

            <div className="mt-8">
              <Button className="w-full" size="lg" asChild>
                <Link href="/signup?plan=pro">Start 14-Day Free Trial</Link>
              </Button>
              <p className="mt-4 text-center text-xs text-muted-foreground">
                Cancel anytime.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
