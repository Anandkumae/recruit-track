
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Zap, Users, BarChart, ArrowRight, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useUser } from '@/firebase';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { WithId, Job } from '@/lib/types';
import { format } from 'date-fns';

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
        question: "What is LeoRecruit?",
        answer: "LeoRecruit is a modern, AI-powered internal hiring platform designed to streamline your recruitment process. It helps you manage job postings, track candidates, and use AI to find the best-fit applicants from within your talent pool."
    },
    {
        question: "How does the AI-powered matching work?",
        answer: "Our advanced AI analyzes the text from a candidate's resume and compares it against the job description you provide. It calculates a match score based on skills, experience, and other key factors, giving you a quick way to identify top contenders."
    },
    {
        question: "Is LeoRecruit suitable for small businesses?",
        answer: "Absolutely! LeoRecruit is scalable and designed to be intuitive for teams of all sizes. Whether you're a small startup or a large enterprise, our platform can help you organize and simplify your hiring workflow."
    },
    {
        question: "Is my data secure?",
        answer: "Yes, data security is our top priority. All data is encrypted in transit and at rest. We follow industry best practices to ensure your company and candidate information is always protected."
    },
    {
        question: "How do I get started?",
        answer: "Getting started is easy! Click the 'Get Started' button, sign in, and you can begin exploring the platform's features immediately. You can create jobs, view candidates, and test the AI resume matcher."
    }
]

const staticJobs: WithId<Job>[] = [
    {
    "id": "job-1",
    "title": "Senior Frontend Engineer (React)",
    "department": "Engineering",
    "description": "We are seeking a highly skilled Senior Frontend Engineer to lead the development of our next-generation user interfaces. You will be responsible for building, testing, and deploying complex, scalable, and performant web applications using React and the latest frontend technologies.",
    "requirements": [
      "5+ years of professional experience in frontend development.",
      "Expert-level proficiency in JavaScript, React, and TypeScript."
    ],
    "status": "Open",
    "postedBy": "user-2",
    "createdAt": "2024-05-20T10:00:00Z"
  },
  {
    "id": "job-2",
    "title": "AI Prompt Engineer",
    "department": "Innovation",
    "description": "As an AI Prompt Engineer, you will be at the forefront of our generative AI initiatives. You will specialize in designing, refining, and optimizing prompts for large language models (LLMs) to generate high-quality, accurate, and contextually relevant content.",
    "requirements": [
      "Proven experience in prompt engineering or working extensively with LLMs (e.g., Gemini, GPT-4).",
      "Excellent command of the English language with a talent for creative and technical writing."
    ],
    "status": "Open",
    "postedBy": "user-1",
    "createdAt": "2024-05-18T14:30:00Z"
  },
  {
    "id": "job-4",
    "title": "Cloud Infrastructure Engineer",
    "department": "Platform Engineering",
    "description": "As a Cloud Infrastructure Engineer, you will be responsible for designing, building, and maintaining our scalable and reliable cloud infrastructure on Google Cloud Platform (GCP). You will work with technologies like Kubernetes, Terraform, and Docker to automate our infrastructure.",
    "requirements": [
      "4+ years of experience in a DevOps or Infrastructure Engineering role.",
      "Hands-on experience with Google Cloud Platform (GCP) or another major cloud provider (AWS, Azure)."
    ],
    "status": "Open",
    "postedBy": "user-3",
    "createdAt": "2024-05-25T12:00:00Z"
  }
];


function RecentJobsSection() {
    const jobs = staticJobs;
    const isLoading = false;

    const formatDate = (timestamp: any) => {
      if (!timestamp) return '';
      if (timestamp.toDate) {
        return format(timestamp.toDate(), 'MMM d, yyyy');
      }
      return format(new Date(timestamp), 'MMM d, yyyy');
    }

    if (isLoading) {
        return (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                    <Card key={i} className="flex flex-col">
                        <CardHeader>
                            <div className="h-6 bg-muted rounded w-3/4 animate-pulse"></div>
                            <div className="h-4 bg-muted rounded w-1/2 mt-2 animate-pulse"></div>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-2">
                             <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
                             <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
                             <div className="h-4 bg-muted rounded w-5/6 animate-pulse"></div>
                        </CardContent>
                        <div className="p-6 pt-0">
                            <div className="h-10 bg-muted rounded w-full animate-pulse"></div>
                        </div>
                    </Card>
                ))}
            </div>
        )
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {jobs?.slice(0, 3).map(job => (
                <Card key={job.id} className="flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <CardHeader>
                        <CardTitle className="text-xl">{job.title}</CardTitle>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>{job.department}</span>
                            <span>{formatDate(job.createdAt)}</span>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow">
                         <p className="text-sm text-muted-foreground line-clamp-3">{job.description}</p>
                    </CardContent>
                    <div className="p-6 pt-0">
                        <Button asChild className="w-full">
                            <Link href={`/jobs/${job.id}`}>View Job</Link>
                        </Button>
                    </div>
                </Card>
            ))}
        </div>
    )
}

export default function LandingPage() {
  const { user } = useUser();
  
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <Link href="/" className="flex items-center justify-center gap-2">
          <Briefcase className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">LeoRecruit</span>
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
        <section className="w-full py-20 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900/50">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:gap-16 items-center">
              <div className="flex flex-col justify-center space-y-4">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl xl:text-7xl/none">
                  Find Your Next Opportunity
                </h1>
                <p className="max-w-[700px] text-muted-foreground md:text-xl">
                  Browse our open positions and discover a role that matches your skills and ambitions. Your next career move starts here.
                </p>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button size="lg" asChild className="transition-transform duration-300 hover:scale-105">
                    <Link href={user ? "/jobs" : "/login"}>
                      {user ? "Browse All Jobs" : "Get Started Free"}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </div>
              </div>
              <Image
                src="https://placehold.co/600x400/216EFA/FFFFFF/png?text=LeoRecruit&font=raleway"
                alt="Hero Illustration"
                width={600}
                height={400}
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full transition-transform duration-300 hover:scale-105"
                data-ai-hint="abstract 3d"
              />
            </div>
          </div>
        </section>

         {/* Jobs Section */}
        <section className="w-full py-20 md:py-32">
            <div className="container px-4 md:px-6">
                 <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Recent Job Openings</h2>
                        <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                            Explore the latest opportunities to join our team.
                        </p>
                    </div>
                </div>
                <RecentJobsSection />
            </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-20 md:py-32 bg-gray-50 dark:bg-gray-900/50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">Key Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Everything you need to streamline hiring.</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  From AI-powered resume screening to a centralized candidate database, LeoRecruit provides the tools to build your dream team.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:max-w-none lg:grid-cols-4 mt-12">
              {features.map((feature) => (
                 <Card key={feature.title} className="h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <CardContent className="p-6 flex flex-col items-start text-left gap-4">
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
        <section className="w-full py-20 md:py-32">
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
        <p className="text-xs text-muted-foreground">&copy; 2024 LeoRecruit. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="mailto:support@leorecruit.com" className="text-xs hover:underline underline-offset-4">
            support@leorecruit.com
          </Link>
          <Link href="/terms" className="text-xs hover:underline underline-offset-4">
            Terms of Service
          </Link>
          <Link href="/privacy" className="text-xs hover:underline underline-offset-4">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
