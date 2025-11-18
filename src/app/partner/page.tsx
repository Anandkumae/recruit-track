
import { Briefcase, Handshake, Zap, Goal } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const partnershipBenefits = [
  {
    icon: Zap,
    title: 'Integrate Your Tools',
    description: 'Seamlessly connect your HR tools, assessment platforms, or other services with the LeoRecruit ecosystem through our flexible API.',
  },
  {
    icon: Handshake,
    title: 'Co-Marketing Opportunities',
    description: 'Reach a wider audience of HR leaders and talent acquisition professionals through joint webinars, case studies, and marketing campaigns.',
  },
  {
    icon: Goal,
    title: 'Access a Growing Network',
    description: 'Become a preferred partner for our growing list of enterprise clients who are dedicated to improving their internal mobility.',
  },
]

export default function PartnerPage() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky inset-x-0 top-0 z-50 bg-background/95 py-4 shadow-sm backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-2xl font-bold text-primary"
          >
            <Briefcase className="h-7 w-7" />
            LeoRecruit
          </Link>
          <nav>
            <Link
              href="/jobs"
              className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Jobs
            </Link>
            <Link
              href="/about"
              className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              About
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="bg-background py-20 md:py-32">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
              Become a LeoRecruit Partner
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Join us in our mission to reshape the future of work by building
              a powerful ecosystem for internal talent mobility.
            </p>
            <div className="mt-8">
              <Button size="lg" asChild>
                <Link href="/contact">Apply to Partner</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-20 md:py-24">
          <div className="container mx-auto max-w-5xl px-4">
             <div className="mb-12 flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                  Why Partner with Us?
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed">
                  LeoRecruit is more than just a platform; it's a growing network of forward-thinking companies. By partnering with us, you can enhance your offerings and reach a dedicated audience.
                </p>
              </div>
            </div>
            <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-3">
              {partnershipBenefits.map((benefit) => (
                <Card key={benefit.title} className="text-center">
                  <CardHeader>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <benefit.icon className="h-6 w-6 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h3 className="text-lg font-semibold">{benefit.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {benefit.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-muted/60 py-20 md:py-24">
          <div className="container mx-auto max-w-3xl px-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Ready to build the future of hiring together?</h2>
            <p className="mt-4 text-muted-foreground">
                We're looking for partners who are as passionate about talent and technology as we are. If you have a solution that can help companies hire and grow better, let's talk.
            </p>
             <div className="mt-8">
              <Button size="lg" asChild>
                <Link href="/contact">Contact Our Partnerships Team</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-background py-6">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} LeoRecruit. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
