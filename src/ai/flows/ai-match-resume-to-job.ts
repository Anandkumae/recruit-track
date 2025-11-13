
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
import { getCandidateResumeText as getCandidateResumeTextAction } from '@/lib/actions';


const getResumeTextByCandidateIdTool = ai.defineTool(
  {
    name: 'getResumeTextByCandidateId',
    description: "Retrieves the plain text of a candidate's resume from the database using their ID. This is the only way to get the resume if only a candidateId is provided.",
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
    const result = await getCandidateResumeTextAction(candidateId);
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
  tools: [getResumeTextByCandidateIdTool],
  prompt: `You are an AI resume matcher. Your task is to analyze a candidate's resume against the provided job description.

- **Job Description:**
{{jobDescription}}

First, you must obtain the candidate's resume text. 
- If a 'candidateId' is provided, you **must** use the 'getResumeTextByCandidateId' tool to fetch the resume text. Do not guess or assume the resume content.
- If 'resumeText' is provided directly, use that content for your analysis.

If you cannot obtain the resume text for any reason (e.g., the tool returns an error or no input was provided), you must stop. Your reasoning should state the problem clearly (e.g., "Cannot obtain resume text. Neither 'candidateId' nor 'resumeText' was provided."). Set the match score to 0.

Once you have the resume text, you must:
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
    const { output } = await matchResumeToJobPrompt(input);
    
    if (!output) {
      throw new Error("The AI model failed to generate a valid analysis. Please check the inputs and try again.");
    }
    
    return output;
  }
);
