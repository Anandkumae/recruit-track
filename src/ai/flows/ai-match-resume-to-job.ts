
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
  jobDescription: z.string().describe('The description of the job posting.'),
  photoDataUri: z
    .string()
    .describe(
      "A photo of a resume, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
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

export async function matchResumeToJob(input: MatchResumeToJobInput): Promise<MatchResumeToJobOutput | null> {
  return matchResumeToJobFlow(input);
}

const matchResumeToJobPrompt = ai.definePrompt({
  name: 'matchResumeToJobPrompt',
  input: { schema: MatchResumeToJobInputSchema },
  output: { schema: MatchResumeToJobOutputSchema },
  prompt: `You are an AI resume matcher. Your task is to analyze a candidate's resume, provided as an image, against the provided job description.

- **Job Description:**
{{jobDescription}}

- **Resume Image:**
{{media url=photoDataUri}}

First, you must accurately extract the text from the provided resume image.

Once you have the resume text, you must:
1.  Calculate a "match score" out of 100 that represents how well the candidate's skills and experience align with the job requirements.
2.  Provide a concise "reasoning" that explains your score. Highlight specific skills, experiences, or keywords from the resume that are relevant to the job description.

If you cannot extract text from the image, your reasoning should state that the image was unreadable or not a valid resume, and you should set the match score to 0.

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
    const { output } = await matchResumeToJobPrompt(input);
    
    if (!output) {
      throw new Error("The AI model failed to generate a valid analysis. Please check the inputs and try again.");
    }
    
    return output;
  }
);
