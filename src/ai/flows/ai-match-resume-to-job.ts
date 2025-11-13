
'use server';
/**
 * @fileOverview An AI agent that matches a resume to a job description and provides a match score.
 *
 * - matchResumeToJob - A function that handles the resume matching process.
 * - MatchResumeToJobInput - The input type for the matchResumeTo-Job function.
 * - MatchResumeToJobOutput - The return type for the matchResumeToJob function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MatchResumeToJobInputSchema = z.object({
  resumeDataUri: z
    .string()
    .describe(
      "A candidate's resume, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    )
    .optional(),
  resumeText: z
    .string()
    .describe("The plain text content of the candidate's resume.")
    .optional(),
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
  input: { schema: MatchResumeToJobInputSchema },
  output: { schema: MatchResumeToJobOutputSchema },
  prompt: `You are an AI resume matcher. Your task is to analyze the provided candidate resume against the job description.

You will be given either a resume file (like a PDF) or the plain text of a resume. Prioritize the file if both are provided.

- **Resume (File):** {{#if resumeDataUri}}{{media url=resumeDataUri}}{{/if}}
- **Resume (Text):** {{#if resumeText}}{{resumeText}}{{/if}}

- **Job Description:**
{{jobDescription}}

Based on this, you must:
1.  Calculate a "match score" out of 100 that represents how well the candidate's skills and experience align with the job requirements.
2.  Provide a concise "reasoning" that explains your score. Highlight specific skills, experiences, or keywords from the resume that are relevant to the job description.

Return the response as a valid JSON object matching the output schema.
`,
});

const matchResumeToJobFlow = ai.defineFlow(
  {
    name: 'matchResumeToJobFlow',
    inputSchema: MatchResumeToJobInputSchema,
    outputSchema: MatchResumeToJobOutputSchema,
  },
  async (input) => {
    if (!input.resumeDataUri && !input.resumeText) {
      throw new Error("Either a resume file (resumeDataUri) or resume text (resumeText) must be provided.");
    }
    
    // Pass only the relevant fields to the prompt
    const { output } = await matchResumeToJobPrompt({
      resumeDataUri: input.resumeDataUri,
      resumeText: input.resumeText,
      jobDescription: input.jobDescription,
    });
    
    return output!;
  }
);
