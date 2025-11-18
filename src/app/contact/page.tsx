
import { Briefcase, Mail, Phone, MapPin } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function ContactPage() {
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
              Get in Touch
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Have a question, feedback, or a partnership inquiry? We'd love to
              hear from you.
            </p>
          </div>
        </section>

        <section className="container mx-auto -mt-16 grid max-w-6xl gap-8 px-4 pb-20 md:grid-cols-2 lg:grid-cols-3">
          <Card className="flex flex-col items-center p-6 text-center">
            <Mail className="h-10 w-10 text-primary" />
            <h3 className="mt-4 text-lg font-semibold">Email Us</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              For general inquiries and support.
            </p>
            <a
              href="mailto:support@leorecruit.com"
              className="mt-4 text-sm font-medium text-primary hover:underline"
            >
              support@leorecruit.com
            </a>
          </Card>
          <Card className="flex flex-col items-center p-6 text-center">
            <Phone className="h-10 w-10 text-primary" />
            <h3 className="mt-4 text-lg font-semibold">Call Us</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Mon-Fri, 9am - 5pm EST.
            </p>
            <p className="mt-4 text-sm font-medium text-primary">
              +1 (555) 123-4567
            </p>
          </Card>
          <Card className="flex flex-col items-center p-6 text-center lg:col-span-1">
            <MapPin className="h-10 w-10 text-primary" />
            <h3 className="mt-4 text-lg font-semibold">Our Office</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              123 Innovation Drive,
              <br />
              Tech City, 12345
            </p>
          </Card>
        </section>

        <section className="container mx-auto max-w-4xl px-4 pb-20 md:pb-32">
          <Card>
            <CardHeader>
              <CardTitle>Send us a message</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" placeholder="Your name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="Your email" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" placeholder="Message subject" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Your message..."
                    rows={6}
                  />
                </div>
                <Button type="submit" className="w-full">
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>
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
