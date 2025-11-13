
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
import { getCandidateResumeText } from '@/lib/actions';


const getResumeTextByCandidateId = ai.defineTool(
  {
    name: 'getResumeTextByCandidateId',
    description: "Retrieves the plain text of a candidate's resume from the database using their ID.",
    inputSchema: z.object({
      candidateId: z.string().describe('The unique ID of the candidate whose resume text should be retrieved.'),
    }),
    outputSchema: z.object({
        resumeText: z.string().describe("The text content of the candidate's resume, or an error message if it could not be retrieved."),
    }),
  },
  async ({ candidateId }) => {
    // This tool calls a Next.js server action.
    // The server action is responsible for securely accessing the database.
    const result = await getCandidateResumeText(candidateId);
    if (result.error) {
        return { resumeText: `ERROR: ${result.error}` };
    }
    return { resumeText: result.resumeText || '' };
  }
);


const MatchResumeToJobInputSchema = z.object({
  jobDescription: z.string().describe('The description of the job posting.'),
  candidateId: z.string().optional().describe("The ID of the candidate whose resume should be analyzed."),
  resumeText: z.string().optional().describe("The plain text content of the candidate's resume. Use this if candidateId is not provided."),
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
  tools: [getResumeTextByCandidateId],
  prompt: `You are an AI resume matcher. Your task is to analyze a candidate's resume against the provided job description.

- **Job Description:**
{{jobDescription}}

First, you must obtain the candidate's resume text. 
- If a 'candidateId' is provided, you **must** use the 'getResumeTextByCandidateId' tool to fetch the resume text. Do not guess or assume the resume content.
- If 'resumeText' is provided directly, use that content for your analysis.

If the tool returns a resumeText that starts with 'ERROR:', you must stop. Your reasoning should contain only that error message and nothing else. Set the match score to 0.

Once you have the resume text, you must:
1.  Calculate a "match score" out of 100 that represents how well the candidate's skills and experience align with the job requirements.
2.  Provide a concise "reasoning" that explains your score. Highlight specific skills, experiences, or keywords from the resume that are relevant to the job description.

If you cannot obtain the resume text for any reason, you cannot complete the task.
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
    if (!input.candidateId && !input.resumeText) {
      throw new Error("Either a candidate ID (candidateId) or resume text (resumeText) must be provided.");
    }
    
    const { output } = await matchResumeToJobPrompt(input);
    
    return output;
  }
);
