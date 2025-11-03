
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Briefcase, Zap, Users, BarChart, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const features = [
  {
    icon: Zap,
    title: 'AI-Powered Matching',
    description: 'Instantly score and rank candidates based on how well their resume matches your job description.',
  },
  {
    icon: Briefcase,
    title: 'Centralized Job Board',
    description: 'Manage all your job postings from a single, streamlined dashboard.',
  },
  {
    icon: Users,
    title: 'Candidate Tracking',
    description: 'Move candidates through your hiring pipeline with ease, from application to offer.',
  },
  {
    icon: BarChart,
    title: 'Insightful Analytics',
    description: 'Gain valuable insights into your recruitment process to make data-driven decisions.',
  },
];

const faqs = [
    {
        question: "What is RecruitTrack?",
        answer: "RecruitTrack is a modern, AI-powered internal hiring platform designed to streamline your recruitment process. It helps you manage job postings, track candidates, and use AI to find the best-fit applicants from within your talent pool."
    },
    {
        question: "How does the AI-powered matching work?",
        answer: "Our advanced AI analyzes the text from a candidate's resume and compares it against the job description you provide. It calculates a match score based on skills, experience, and other key factors, giving you a quick way to identify top contenders."
    },
    {
        question: "Is RecruitTrack suitable for small businesses?",
        answer: "Absolutely! RecruitTrack is scalable and designed to be intuitive for teams of all sizes. Whether you're a small startup or a large enterprise, our platform can help you organize and simplify your hiring workflow."
    },
    {
        question: "Is my data secure?",
        answer: "Yes, data security is our top priority. All data is encrypted in transit and at rest. We follow industry best practices to ensure your company and candidate information is always protected."
    },
    {
        question: "How do I get started?",
        answer: "Getting started is easy! Click the 'Get Started' button, sign in with a demo role, and you can begin exploring the platform's features immediately. You can create jobs, view candidates, and test the AI resume matcher."
    }
]

export default function LandingPage() {
  const { user } = useAuth();
  
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <Link href="/" className="flex items-center justify-center gap-2">
          <Briefcase className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">RecruitTrack</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          {user ? (
             <Button asChild>
                <Link href="/dashboard">
                  Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
          ) : (
            <>
            <Button variant="ghost" asChild>
              <Link href="/login">Login</Link>
            </Button>
             <Button asChild>
                <Link href="/login">
                  Get Started
                </Link>
              </Button>
            </>
          )}
        </nav>
      </header>
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-20 md:py-32 lg:py-40 bg-gray-50 dark:bg-gray-900/50">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:gap-16 items-center">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl xl:text-7xl/none">
                  Hire smarter, not harder.
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  RecruitTrack is the AI-powered internal hiring platform that helps you find the perfect candidate, faster.
                </p>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                   <Button size="lg" asChild>
                      <Link href={user ? "/dashboard" : "/login"}>
                        {user ? "View Dashboard" : "Get Started Free"}
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                </div>
              </div>
              <Image
                src="https://picsum.photos/seed/hero-image/800/600"
                width={800}
                height={600}
                alt="Hero"
                className="mx-auto aspect-[4/3] overflow-hidden rounded-xl object-cover"
                data-ai-hint="recruitment dashboard"
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-20 md:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">Key Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Everything you need to streamline hiring.</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  From AI-powered resume screening to a centralized candidate database, RecruitTrack provides the tools to build your dream team.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:max-w-none lg:grid-cols-4 mt-12">
              {features.map((feature) => (
                 <Card key={feature.title} className="h-full">
                    <CardContent className="p-6 flex flex-col items-start gap-4">
                        <div className="inline-block rounded-lg bg-primary/10 p-3 text-primary">
                            <feature.icon className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-bold">{feature.title}</h3>
                        <p className="text-muted-foreground">{feature.description}</p>
                    </CardContent>
                 </Card>
              ))}
            </div>
          </div>
        </section>
        
        {/* FAQ Section */}
        <section className="w-full py-20 md:py-32 bg-gray-50 dark:bg-gray-900/50">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-2">
                        <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">FAQ</div>
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Frequently Asked Questions</h2>
                        <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                            Have questions? We've got answers. Here are some of the most common questions we get.
                        </p>
                    </div>
                </div>
                <div className="mx-auto max-w-3xl mt-12">
                    <Accordion type="single" collapsible className="w-full">
                        {faqs.map((faq, index) => (
                            <AccordionItem key={index} value={`item-${index}`}>
                                <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                                <AccordionContent className="text-muted-foreground">
                                    {faq.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </div>
        </section>

      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 RecruitTrack. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
