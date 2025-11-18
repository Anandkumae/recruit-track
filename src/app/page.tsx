
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Briefcase,
  Zap,
  Users,
  BarChart,
  ArrowRight,
  Loader2,
  Linkedin,
  Instagram,
  Handshake,
  Goal,
} from 'lucide-react';
import Image from 'next/image';
import { useUser } from '@/firebase';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { WithId, Job } from '@/lib/types';
import { format } from 'date-fns';
import { useMemoFirebase, useFirestore, useCollection } from '@/firebase';
import { collection, query, limit, where } from 'firebase/firestore';

const staticJobs: WithId<Job>[] = [
  {
    id: 'job-4',
    title: 'Cloud Infrastructure Engineer',
    department: 'Platform Engineering',
    description:
      'As a Cloud Infrastructure Engineer, you will be responsible for designing, building, and maintaining our scalable and reliable cloud infrastructure on Google Cloud Platform (GCP). You will work with technologies like Kubernetes, Terraform, and Docker to automate our infrastructure and deployment pipelines, ensuring our services are secure, available, and performant.',
    requirements: [
      '4+ years of experience in a DevOps or Infrastructure Engineering role.',
      'Hands-on experience with Google Cloud Platform (GCP) or another major cloud provider (AWS, Azure).',
      'Proficiency with Infrastructure as Code (IaC) tools, particularly Terraform.',
      'Strong knowledge of containerization and orchestration (Docker, Kubernetes).',
      'Experience with CI/CD pipelines (e.g., Jenkins, GitLab CI, GitHub Actions).',
      'Familiarity with monitoring and logging tools like Prometheus, Grafana, or the ELK stack.',
    ],
    status: 'Open',
    postedBy: 'user-3',
    createdAt: '2024-05-25T12:00:00Z',
  },
  {
    id: 'job-1',
    title: 'Senior Frontend Engineer (React)',
    department: 'Engineering',
    description:
      'We are seeking a highly skilled Senior Frontend Engineer to lead the development of our next-generation user interfaces. You will be responsible for building, testing, and deploying complex, scalable, and performant web applications using React and the latest frontend technologies. The ideal candidate has a passion for creating beautiful, intuitive user experiences and a strong understanding of modern web development principles.',
    requirements: [
      '5+ years of professional experience in frontend development.',
      'Expert-level proficiency in JavaScript, React, and TypeScript.',
      'Deep understanding of state management libraries like Redux or Zustand.',
      'Experience with Next.js and server-side rendering (SSR).',
      'Proficient in writing clean, maintainable code and unit tests with Jest/RTL.',
      'Strong knowledge of HTML5, CSS3, and responsive design principles.',
    ],
    status: 'Open',
    postedBy: 'user-2',
    createdAt: '2024-05-20T10:00:00Z',
  },
  {
    id: 'job-2',
    title: 'AI Prompt Engineer',
    department: 'Innovation',
    description:
      'As an AI Prompt Engineer, you will be at the forefront of our generative AI initiatives. You will specialize in designing, refining, and optimizing prompts for large language models (LLMs) to generate high-quality, accurate, and contextually relevant content. This role requires a unique blend of creativity, linguistic precision, and technical understanding of AI systems.',
    requirements: [
      'Proven experience in prompt engineering or working extensively with LLMs (e.g., Gemini, GPT-4).',
      'Excellent command of the English language with a talent for creative and technical writing.',
      'Basic understanding of machine learning concepts and how LLMs work.',
      'Ability to analyze AI-generated content and provide feedback for model tuning.',
      'Experience with scripting languages like Python for automation is a plus.',
      'A portfolio of sophisticated prompts and their outputs is highly desirable.',
    ],
    status: 'Open',
    postedBy: 'user-1',
    createdAt: '2024-05-18T14:30:00Z',
  },
];

const features = [
  {
    icon: Zap,
    title: 'AI-Powered Matching',
    description:
      'Instantly score and rank candidates based on how well their resume matches your job description.',
  },
  {
    icon: Briefcase,
    title: 'Centralized Job Board',
    description:
      'Manage all your job postings from a single, streamlined dashboard.',
  },
  {
    icon: Users,
    title: 'Candidate Tracking',
    description:
      'Move candidates through your hiring pipeline with ease, from application to offer.',
  },
  {
    icon: BarChart,
    title: 'Insightful Analytics',
    description:
      'Gain valuable insights into your recruitment process to make data-driven decisions.',
  },
];

const faqs = [
  {
    question: 'What is LeoRecruit?',
    answer:
      "LeoRecruit is a modern, AI-powered internal hiring platform designed to streamline your recruitment process. It helps you manage job postings, track candidates, and use AI to find the best-fit applicants from within your talent pool.",
  },
  {
    question: 'How does the AI-powered matching work?',
    answer:
      "Our advanced AI analyzes the text from a candidate's resume and compares it against the job description you provide. It calculates a match score based on skills, experience, and other key factors, giving you a quick way to identify top contenders.",
  },
  {
    question: 'Is LeoRecruit suitable for small businesses?',
    answer:
      "Absolutely! LeoRecruit is scalable and designed to be intuitive for teams of all sizes. Whether you're a small startup or a large enterprise, our platform can help you organize and simplify your hiring workflow.",
  },
  {
    question: 'Is my data secure?',
    answer:
      'Yes, data security is our top priority. All data is encrypted in transit and at rest. We follow industry best practices to ensure your company and candidate information is always protected.',
  },
  {
    question: 'How do I get started?',
    answer:
      "Getting started is easy! Click the 'Get Started' button, sign in, and you can begin exploring the platform's features immediately. You can create jobs, view candidates, and test the AI resume matcher.",
  },
];

function RecentJobsSection() {
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    if (timestamp.toDate) {
      return format(timestamp.toDate(), 'MMM d, yyyy');
    }
    return format(new Date(timestamp), 'MMM d, yyyy');
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {staticJobs.map((job) => (
        <Card
          key={job.id}
          className="flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
        >
          <CardHeader>
            <CardTitle className="text-xl">{job.title}</CardTitle>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{job.department}</span>
              <span>{formatDate(job.createdAt)}</span>
            </div>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="line-clamp-3 text-sm text-muted-foreground">
              {job.description}
            </p>
          </CardContent>
          <div className="p-6 pt-0">
            <Button asChild className="w-full">
              <Link href={`/jobs/${job.id}`}>View Job</Link>
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function LandingPage() {
  const { user } = useUser();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky inset-x-0 top-4 z-50 mx-auto max-w-5xl">
        <nav className="flex items-center justify-between rounded-full border bg-background/95 p-2 shadow-sm backdrop-blur-sm lg:px-4">
          <Link
            href="/"
            className="flex items-center justify-center gap-2"
          >
            <Briefcase className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">LeoRecruit</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
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
                  <Link href="/login">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </nav>
      </header>
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-20 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-12 xl:gap-16">
              <div className="flex flex-col justify-center space-y-4">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl xl:text-7xl/none">
                  Find Your Next Opportunity
                </h1>
                <p className="max-w-[700px] text-muted-foreground md:text-xl">
                  Browse our open positions and discover a role that matches
                  your skills and ambitions. Your next career move starts here.
                </p>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button
                    size="lg"
                    asChild
                    className="transition-transform duration-300 hover:scale-105"
                  >
                    <Link href={user ? '/jobs' : '/login'}>
                      {user ? 'Browse All Jobs' : 'Get Started Free'}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </div>
              </div>
              <Image
                src="https://placehold.co/600x400/2563EB/FFFFFF/png?text=3D+Illustration&font=raleway"
                alt="Hero Illustration"
                width={600}
                height={400}
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center transition-transform duration-300 hover:scale-105 sm:w-full"
                data-ai-hint="abstract 3d"
              />
            </div>
          </div>
        </section>

        {/* Jobs Section */}
        <section className="w-full bg-gray-50 py-20 dark:bg-gray-900/50 md:py-32">
          <div className="container px-4 md:px-6">
            <div className="mb-12 flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Recent Job Openings
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Explore the latest opportunities to join our team.
                </p>
              </div>
            </div>
            <RecentJobsSection />
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-20 md:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">
                  Key Features
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Everything you need to streamline hiring.
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  From AI-powered resume screening to a centralized candidate
                  database, LeoRecruit provides the tools to build your dream
                  team.
                </p>
              </div>
            </div>
            <div className="mx-auto mt-12 grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:max-w-none lg:grid-cols-4">
              {features.map((feature) => (
                <Card
                  key={feature.title}
                  className="h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <CardContent className="flex flex-col items-start gap-4 p-6 text-left">
                    <div className="inline-block rounded-lg bg-primary/10 p-3 text-primary">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold">{feature.title}</h3>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Mobile App Promo Section */}
        <section className="w-full bg-gray-50 py-20 dark:bg-gray-900/50 md:py-32">
          <div className="container grid items-center justify-center gap-8 px-4 text-center md:px-6 lg:grid-cols-2 lg:text-left">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Hiring on the Go
              </h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:mx-0">
                Manage your entire recruitment pipeline from anywhere with the LeoRecruit mobile app. Coming soon to iOS and Android.
              </p>
              <Button size="lg" disabled>
                📱 Download LeoRecruit App
              </Button>
            </div>
            <Image
              src="https://placehold.co/600x600/2563EB/FFFFFF/png?text=App+Mockup&font=raleway"
              width="400"
              height="400"
              alt="Mobile App Mockup"
              className="mx-auto overflow-hidden rounded-2xl object-cover object-center transition-transform duration-300 hover:scale-105"
              data-ai-hint="mobile app interface"
            />
          </div>
        </section>

        {/* FAQ Section */}
        <section className="w-full py-20 md:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">
                  FAQ
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Frequently Asked Questions
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Have questions? We've got answers. Here are some of the most
                  common questions we get.
                </p>
              </div>
            </div>
            <div className="mx-auto mt-12 max-w-3xl">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
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
      <footer className="border-t bg-background">
        <div className="container mx-auto grid grid-cols-2 gap-8 px-4 py-12 md:grid-cols-4 md:px-6">
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Briefcase className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">LeoRecruit</span>
            </Link>
            <p className="max-w-xs text-sm text-muted-foreground">
              The modern hiring platform for internal recruitment.
            </p>
          </div>
          <div className="grid gap-2">
            <h3 className="text-sm font-semibold">Company</h3>
            <Link
              href="/about"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Contact
            </Link>
          </div>
          <div className="grid gap-2">
            <h3 className="text-sm font-semibold">Resources</h3>
            <Link
              href="/#faq"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              FAQ
            </Link>
            <Link
              href="/partner"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Become a Partner
            </Link>
          </div>
          <div className="grid gap-2">
            <h3 className="text-sm font-semibold">Legal</h3>
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Terms of Service
            </Link>
          </div>
        </div>
        <div className="border-t py-6">
          <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 md:flex-row md:px-6">
            <p className="text-xs text-muted-foreground">
              &copy; 2024 LeoRecruit. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Linkedin className="h-5 w-5 text-muted-foreground transition-colors hover:text-foreground" />
                <span className="sr-only">LinkedIn</span>
              </Link>
              <Link
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram className="h-5 w-5 text-muted-foreground transition-colors hover:text-foreground" />
                <span className="sr-only">Instagram</span>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
