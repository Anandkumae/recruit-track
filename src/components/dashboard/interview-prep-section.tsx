'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Lightbulb, ListChecks } from 'lucide-react';
import { AiInterviewQuestions } from './ai-interview-questions';

const commonQuestions = [
    "Tell me about yourself.",
    "What are your strengths and weaknesses?",
    "Why are you interested in this role?",
    "Where do you see yourself in 5 years?",
    "Why do you want to work for this company?",
    "Tell me about a time you faced a conflict at work.",
    "Describe a challenging project you worked on.",
    "How do you handle pressure or stressful situations?",
    "What are your salary expectations?",
    "Do you have any questions for us?",
    "What do you know about our company?",
    "How do you stay updated with industry trends?",
    "Tell me about a time you made a mistake.",
    "What is your preferred work environment?",
    "How do you work in a team?",
    "What motivates you?",
    "Tell me about a time you demonstrated leadership skills.",
    "How do you prioritize your work?",
    "What are you looking for in a new position?",
    "What is your greatest professional achievement?",
];

const roleTips = [
    "Research the company's recent projects and news.",
    "Prepare specific examples from your experience that match the job requirements.",
    "Understand the company culture and think about how you align with it.",
    "Practice the STAR method (Situation, Task, Action, Result) for behavioral questions.",
    "Prepare a list of thoughtful questions to ask the interviewer.",
]

export function InterviewPrepSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Interview Prep Hub</CardTitle>
        <CardDescription>
          Resources to help you succeed in your next interview.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>
                <div className="flex items-center gap-3">
                    <ListChecks className="h-5 w-5 text-primary" />
                    <span>Top 20 Common Interview Questions</span>
                </div>
            </AccordionTrigger>
            <AccordionContent>
                <ul className="list-decimal space-y-2 pl-6 pt-2 text-sm text-muted-foreground">
                    {commonQuestions.map((question, index) => (
                        <li key={index}>{question}</li>
                    ))}
                </ul>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>
                 <div className="flex items-center gap-3">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    <span>Tips for Your Applied Role</span>
                </div>
            </AccordionTrigger>
            <AccordionContent>
               <ul className="list-disc space-y-2 pl-6 pt-2 text-sm text-muted-foreground">
                    {roleTips.map((tip, index) => (
                        <li key={index}>{tip}</li>
                    ))}
                </ul>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>
                <div className="flex items-center gap-3">
                    <Bot className="h-5 w-5 text-primary" />
                    <span>AI-Generated Questions</span>
                </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-4">
              <p className="text-sm text-muted-foreground">
                Enter a job title to get AI-generated interview questions tailored to that role.
              </p>
              <AiInterviewQuestions />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
