'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Check, ArrowLeft, Building2 } from 'lucide-react';

export default function BusinessPlanPage() {
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
              Enterprise-Grade Solutions
            </h1>
            <p className="mt-4 text-xl text-muted-foreground">
              Custom tailored for large organizations with complex hiring needs.
            </p>
          </div>

          <div className="mx-auto mt-12 max-w-lg rounded-xl border bg-card p-8 shadow-lg">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Building2 className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Business</h2>
              <p className="mt-2 text-4xl font-extrabold">Custom</p>
              <p className="text-sm text-muted-foreground">Contact us for pricing</p>
            </div>
            
            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <span>Unlimited job posts</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <span>Advanced security & SSO</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <span>Custom integrations</span>
              </div>
               <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <span>Dedicated account manager</span>
              </div>
            </div>

            <div className="mt-8">
              <Button className="w-full" size="lg" asChild>
                <Link href="/contact?subject=Enterprise+Inquiry">Contact Sales</Link>
              </Button>
              <p className="mt-4 text-center text-xs text-muted-foreground">
                We'll get back to you within 24 hours.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
