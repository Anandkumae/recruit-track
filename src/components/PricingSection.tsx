'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export function PricingSection({ onGetStarted }: { onGetStarted?: () => void }) {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section className="w-full py-20 md:py-32" id="pricing">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">
              Pricing Plans
            </div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
              Find the Perfect Plan
            </h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Choose the plan that's right for your team's size and needs. Start for free and scale as you grow.
            </p>
          </div>
          
          <div className="flex items-center space-x-2 mt-6">
            <Label htmlFor="billing-mode" className={`cursor-pointer ${!isYearly ? 'font-bold' : ''}`}>Monthly</Label>
            <Switch id="billing-mode" checked={isYearly} onCheckedChange={setIsYearly} />
            <Label htmlFor="billing-mode" className={`cursor-pointer ${isYearly ? 'font-bold' : ''}`}>
              Yearly <span className="text-xs text-green-500 font-normal">(Save 20%)</span>
            </Label>
          </div>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl items-start gap-8 md:grid-cols-3">
          {/* Basic Plan */}
          <Card className="flex h-full flex-col">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Basic</CardTitle>
              <p className="text-4xl font-extrabold">Free</p>
              <p className="text-sm text-muted-foreground">For individuals and small teams getting started.</p>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-between">
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" /> 1 active job post
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" /> Basic candidate tracking
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" /> Community support
                </li>
              </ul>
              <Button className="mt-6 w-full" variant="outline" onClick={onGetStarted}>
                Get Started
              </Button>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="relative flex h-full flex-col border-2 border-primary shadow-lg">
            <div className="absolute top-0 right-4 -mt-3 rounded-full bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground">
              Most Popular
            </div>
            <CardHeader>
              <CardTitle className="text-xl font-bold">Pro</CardTitle>
              <div className="flex items-baseline gap-1">
                <p className="text-4xl font-extrabold">
                    {isYearly ? '₹3,999' : '₹4,999'}
                </p>
                <span className="text-base font-normal text-muted-foreground">/month</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                  {isYearly ? 'Billed ₹47,988 yearly' : 'Billed monthly'}
              </p>
              <p className="text-sm text-muted-foreground mt-2">For growing teams that need more power and automation.</p>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-between">
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" /> 10 active job posts
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" /> AI resume matching
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" /> Recruitment analytics
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" /> Email support
                </li>
              </ul>
              <Button className="mt-6 w-full" onClick={onGetStarted}>
                Choose Pro
              </Button>
            </CardContent>
          </Card>

          {/* Business Plan */}
          <Card className="flex h-full flex-col">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Business</CardTitle>
              <p className="text-4xl font-extrabold">Custom</p>
              <p className="text-sm text-muted-foreground">For large organizations with custom needs.</p>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-between">
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" /> Unlimited job posts
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" /> Advanced security & SSO
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" /> Custom integrations
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" /> Dedicated support
                </li>
              </ul>
              <Button className="mt-6 w-full" variant="outline" onClick={onGetStarted}>
                Contact Sales
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
