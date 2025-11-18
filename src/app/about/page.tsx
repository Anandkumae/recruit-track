
import { Briefcase, Users, Target } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
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
              href="/contact"
              className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Contact
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="bg-background py-20 md:py-32">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
              About LeoRecruit
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              We are revolutionizing internal hiring by empowering companies to
              discover and nurture talent from within.
            </p>
          </div>
        </section>

        <section className="py-20 md:py-24">
          <div className="container mx-auto grid gap-16 px-4 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Our Mission</h2>
              <p className="mt-4 text-muted-foreground">
                Our mission is to make internal mobility seamless and
                intelligent. We believe that a company's greatest asset is its
                people, and the best talent is often already within its walls.
                LeoRecruit provides the tools to unlock that potential, helping
                employees grow their careers while enabling organizations to
                retain top performers and build stronger teams.
              </p>
            </div>
            <div className="flex justify-center">
              <Target className="h-48 w-48 text-primary" />
            </div>
          </div>
        </section>

        <section className="bg-muted/60 py-20 md:py-24">
          <div className="container mx-auto grid gap-16 px-4 md:grid-cols-2 md:items-center">
            <div className="flex justify-center md:order-2">
              <Users className="h-48 w-48 text-primary" />
            </div>
            <div className="md:order-1">
              <h2 className="text-3xl font-bold tracking-tight">Our Vision</h2>
              <p className="mt-4 text-muted-foreground">
                We envision a future where every employee has a clear path for
                growth within their organization. By leveraging AI-powered
                insights and creating a transparent internal job marketplace, we
                aim to foster a culture of continuous development, engagement,
                and loyalty. LeoRecruit will be the engine that drives career
                progression and organizational excellence from the inside out.
              </p>
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
