
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
import { getFirebaseAdmin } from '@/firebase/server-config';
import type { Candidate } from '@/lib/types';


const getCandidateById = ai.defineTool(
  {
    name: 'getCandidateById',
    description: "Retrieves a candidate's profile from the database using their ID.",
    inputSchema: z.object({
      candidateId: z.string().describe('The unique ID of the candidate to retrieve.'),
    }),
    outputSchema: z.object({
        resumeText: z.string().optional().describe("The text content of the candidate's resume."),
    }),
  },
  async ({ candidateId }) => {
    try {
      const { firestore } = getFirebaseAdmin();
      const doc = await firestore.collection('candidates').doc(candidateId).get();
      if (!doc.exists) {
        throw new Error('Candidate not found');
      }
      const candidateData = doc.data() as Candidate;
      return {
        resumeText: candidateData.resumeText,
      };
    } catch (error) {
        console.error("Tool 'getCandidateById' failed:", error);
        throw new Error("Failed to retrieve candidate data from the database.");
    }
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
  tools: [getCandidateById],
  prompt: `You are an AI resume matcher. Your task is to analyze a candidate's resume against the provided job description.

- **Job Description:**
{{jobDescription}}

First, you must obtain the candidate's resume. 
- If the candidate's ID is provided ({{candidateId}}), use the 'getCandidateById' tool to fetch their resume text from the database.
- If resume text is provided directly ({{resumeText}}), use that.

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
