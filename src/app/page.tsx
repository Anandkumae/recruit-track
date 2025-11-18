
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
  BookOpen,
} from 'lucide-react';
import Image from 'next/image';
import { useUser } from '@/firebase';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

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

const resources = [
  {
    category: 'Hiring Tips',
    title: '10 Strategies to Attract Top Talent',
    description: 'In a competitive market, finding the right people is crucial. Explore our top 10 strategies to attract and retain the best candidates.',
    content: `
### 1. **Develop a Strong Employer Brand**
Showcase your company culture, values, and mission. A positive brand attracts candidates who align with your vision.

### 2. **Write Compelling Job Descriptions**
Go beyond a list of duties. Sell the opportunity and describe the impact the role will have on the company.

### 3. **Leverage Social Media**
Use platforms like LinkedIn to share job openings, company news, and employee testimonials.

### 4. **Implement an Employee Referral Program**
Your current employees can be your best recruiters. Reward them for bringing in qualified candidates.

### 5. **Offer Competitive Compensation and Benefits**
Research industry standards to ensure your offers are attractive and fair.

### 6. **Provide Clear Growth Opportunities**
Top talent wants to know they have a future at your company. Outline potential career paths.

### 7. **Streamline Your Application Process**
A long, complicated application can deter great candidates. Make it simple and mobile-friendly.

### 8. **Communicate Transparently**
Keep candidates informed at every stage of the hiring process. A positive experience matters, even for those you don't hire.

### 9. **Highlight Flexibility and Work-Life Balance**
In today's market, remote work options and a focus on well-being are major draws.

### 10. **Build a Talent Pipeline**
Stay connected with promising candidates even if you don't have an immediate opening. Future opportunities may arise.
`,
  },
  {
    category: 'Resume Guides',
    title: 'Crafting a Resume That Stands Out',
    description: 'Learn how to build a resume that not only looks great but also passes through applicant tracking systems and catches the eye of recruiters.',
    content: `
### 1. **Tailor It to the Job**
Customize your resume for each application. Use keywords from the job description to show you're a perfect fit.

### 2. **Start with a Powerful Summary**
Write a 2-3 sentence summary at the top that highlights your key qualifications and career goals.

### 3. **Focus on Accomplishments, Not Just Duties**
Instead of saying "Managed social media," say "Increased social media engagement by 40% in six months by implementing a new content strategy." Use numbers to quantify your impact.

### 4. **Keep It Clean and Readable**
Use a professional font, ample white space, and clear section headings. Aim for one page if you have less than 10 years of experience.

### 5. **Optimize for Applicant Tracking Systems (ATS)**
Many companies use ATS to screen resumes. Avoid fancy graphics, tables, and headers/footers that can confuse the software.

### 6. **Include a "Skills" Section**
List your most relevant hard and soft skills. This makes it easy for recruiters to see your qualifications at a glance.

### 7. **Proofread Meticulously**
Typos and grammatical errors are a major red flag. Read your resume multiple times, and ask a friend to review it as well.
`,
  },
  {
    category: 'Interview Prep',
    title: 'Acing Your Next Behavioral Interview',
    description: 'Behavioral questions are a staple of modern interviews. We break down the STAR method and provide examples to help you prepare.',
    content: `
Behavioral questions are designed to assess your past performance as an indicator of future success. The key to answering them effectively is the **STAR method**.

### What is the STAR Method?
- **S - Situation:** Briefly describe the context. Where were you? What was the project or challenge?
- **T - Task:** What was your specific responsibility? What was the goal?
- **A - Action:** What specific steps did you take to address the situation? Focus on *your* contributions.
- **R - Result:** What was the outcome? Quantify it whenever possible (e.g., increased efficiency by 15%, reduced errors by 25%).

### Example Question: "Tell me about a time you had to handle a difficult stakeholder."

**Situation:** "In my previous role as a Project Manager, we were developing a new software feature. One of our key stakeholders had a very different vision for the final product than the engineering team, and progress had stalled."

**Task:** "My task was to bridge the communication gap, align the stakeholder's vision with what was technically feasible, and get the project back on track."

**Action:** "I scheduled a one-on-one meeting with the stakeholder to listen to their concerns and fully understand their goals. Then, I organized a workshop with the engineering team and the stakeholder. I acted as a facilitator, translating the stakeholder's business needs into technical requirements and explaining the engineering constraints in a non-technical way."

**Result:** "Through these discussions, we found a compromise that met the core business objectives while being technically achievable. The stakeholder felt heard and became a champion for the project, and we delivered the feature on schedule, which contributed to a 10% increase in user adoption that quarter."
`,
  },
  {
    category: 'HR Trends',
    title: 'The Rise of Internal Mobility Platforms',
    description: 'Discover why more companies are investing in internal hiring and how it can boost retention and employee satisfaction.',
    content: `
Internal mobility—the practice of moving employees into new roles within the same organization—is no longer just a buzzword; it's a strategic imperative. Here's why platforms like LeoRecruit are becoming essential for modern companies.

### 1. **Boosts Employee Retention**
When employees see clear opportunities for growth within their company, they are far less likely to look for it elsewhere. Investing in internal mobility is a direct investment in retaining your top talent.

### 2. **Reduces Hiring Costs and Time**
External recruitment is expensive and time-consuming. Internal hiring significantly cuts down on sourcing costs, onboarding time, and the "time-to-productivity" for new roles, as internal candidates are already familiar with the company culture and processes.

### 3. **Enhances Employee Engagement**
Employees who feel their company is invested in their career development are more engaged, motivated, and productive. An internal mobility platform sends a clear message that the company values its people and wants to help them succeed.

### 4. **Fills Skills Gaps and Develops Leaders**
By identifying high-potential employees and moving them into new roles, companies can strategically develop the skills and leadership qualities they need for the future. It's a powerful way to build a resilient and adaptable workforce from within.

### 5. **Strengthens Company Culture**
Promoting from within reinforces a positive culture where loyalty, growth, and long-term commitment are rewarded. It creates a virtuous cycle of development and success.
`,
  },
];


function RecentJobsSection() {
    const jobs = [
        {
            "id": "job-1",
            "title": "Senior Frontend Engineer (React)",
            "department": "Engineering",
            "description": "We are seeking a highly skilled Senior Frontend Engineer to lead the development of our next-generation user interfaces. You will be responsible for building, testing, and deploying complex, scalable, and performant web applications using React and the latest frontend technologies.",
            "createdAt": "2024-05-20T10:00:00Z"
        },
        {
            "id": "job-2",
            "title": "AI Prompt Engineer",
            "department": "Innovation",
            "description": "As an AI Prompt Engineer, you will be at the forefront of our generative AI initiatives. You will specialize in designing, refining, and optimizing prompts for large language models (LLMs) to generate high-quality, accurate, and contextually relevant content.",
            "createdAt": "2024-05-18T14:30:00Z"
        },
        {
            "id": "job-4",
            "title": "Cloud Infrastructure Engineer",
            "department": "Platform Engineering",
            "description": "As a Cloud Infrastructure Engineer, you will be responsible for designing, building, and maintaining our scalable and reliable cloud infrastructure on Google Cloud Platform (GCP). You will work with technologies like Kubernetes, Terraform, and Docker to automate our infrastructure and deployment pipelines.",
            "createdAt": "2024-05-25T12:00:00Z"
        }
    ];

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), 'MMM d, yyyy');
        } catch {
            return '';
        }
    };

    if (!jobs || jobs.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                No open positions at the moment. Please check back later!
            </div>
        )
    }

    return (
      <div className="grid grid-cols-1 justify-center gap-6 md:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => (
          <Card
            key={job.id}
            className="flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl w-full"
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
                src="https://placehold.co/600x400/2563EB/FFFFFF/png?text=LeoRecruit&font=raleway"
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

        {/* Blog/Resources Section */}
        <section className="w-full bg-gray-50 py-20 dark:bg-gray-900/50 md:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                 <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">
                  Resources
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Insights & Resources
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Explore our collection of articles on hiring, career growth, and industry trends.
                </p>
              </div>
            </div>
             <div className="mx-auto mt-12 grid max-w-5xl gap-8 sm:grid-cols-2 lg:max-w-none lg:grid-cols-4">
              {resources.map((post) => (
                <Dialog key={post.title}>
                  <Card className="flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                    <CardHeader>
                      <p className="text-sm font-medium text-primary">{post.category}</p>
                      <CardTitle className="text-lg">{post.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="text-sm text-muted-foreground line-clamp-3">{post.description}</p>
                    </CardContent>
                    <div className="p-6 pt-0">
                      <DialogTrigger asChild>
                        <Button variant="link" className="p-0">
                          Read More <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                    </div>
                  </Card>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle className="text-2xl">{post.title}</DialogTitle>
                      <DialogDescription>{post.category}</DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[60vh] pr-4">
                      <div className="prose prose-sm dark:prose-invert max-w-full">
                        {post.content}
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              ))}
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

    