'use server';
/**
 * @fileOverview An AI agent that matches a resume to a job description and provides a match score.
 *
 * - matchResumeToJob - A function that handles the resume matching process.
 * - MatchResumeToJobInput - The input type for the matchResumeToJob function.
 * - MatchResumeToJobOutput - The return type for the matchResumeToJob function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MatchResumeToJobInputSchema = z.object({
  resumeText: z
    .string()
    .describe('The text content of the candidate\'s resume.'),
  jobDescription: z.string().describe('The description of the job posting.'),
});
export type MatchResumeToJobInput = z.infer<typeof MatchResumeToJobInputSchema>;

const MatchResumeToJobOutputSchema = z.object({
  matchScore: z
    .number()
    .describe(
      'A score (out of 100) representing how well the resume matches the job description.'
    ),
  reasoning: z
    .string()
    .describe('The reasoning behind the match score, highlighting key skills and experiences.'),
});
export type MatchResumeToJobOutput = z.infer<typeof MatchResumeToJobOutputSchema>;

export async function matchResumeToJob(input: MatchResumeToJobInput): Promise<MatchResumeToJobOutput> {
  return matchResumeToJobFlow(input);
}

const matchResumeToJobPrompt = ai.definePrompt({
  name: 'matchResumeToJobPrompt',
  input: {schema: MatchResumeToJobInputSchema},
  output: {schema: MatchResumeToJobOutputSchema},
  prompt: `You are an AI resume matcher. Given a resume and a job description, you will provide a match score (out of 100) and reasoning.

Resume:
{{resumeText}}

Job Description:
{{jobDescription}}

Provide a match score (out of 100) and explain the reasoning behind the score. Focus on key skills and experiences that align with the job description.  Return the response as a JSON object.
`,
});

const matchResumeToJobFlow = ai.defineFlow(
  {
    name: 'matchResumeToJobFlow',
    inputSchema: MatchResumeToJobInputSchema,
    outputSchema: MatchResumeToJobOutputSchema,
  },
  async input => {
    const {output} = await matchResumeToJobPrompt(input);
    return output!;
  }
);
