
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
  suggestedSkills: z.array(z.string()).describe('A list of 3-5 key skills from the job description that are missing from the resume and would improve the match.'),
});
export type MatchResumeToJobOutput = z.infer<typeof MatchResumeToJobOutputSchema>;

export async function matchResumeToJob(input: MatchResumeToJobInput): Promise<MatchResumeToJobOutput | null> {
  return matchResumeToJobFlow(input);
}

const matchResumeToJobPrompt = ai.definePrompt({
  name: 'matchResumeToJobPrompt',
  input: { schema: MatchResumeToJobInputSchema },
  output: { schema: MatchResumeToJobOutputSchema },
  prompt: `You are an expert recruiter and AI resume analyst for the LeoRecruit platform. Your task is to provide a comprehensive analysis of a candidate's resume against a given job description.

- **Job Description:**
{{jobDescription}}

- **Resume Image:**
{{media url=photoDataUri}}

First, you must accurately extract the text from the provided resume image.

Then, you must calculate a weighted "match score" out of 100. This score is critical for ranking candidates and must be calculated based on the following rubric:

1.  **Skills Match (70% weight):**
    - Identify the key skills and technologies listed in the job description.
    - Compare them against the skills listed in the resume.
    - Award points based on the level of overlap and proficiency mentioned.

2.  **Experience Relevance (20% weight):**
    - Analyze the candidate's work history, including job titles and responsibilities.
    - Evaluate how closely their past roles and accomplishments align with the duties described in the job description.
    - Consider the duration of relevant experience.

3.  **Resume Quality (10% weight):**
    - Assess the overall professionalism of the resume.
    - Consider factors like clarity, formatting, grammar, and conciseness.
    - A well-structured resume that is easy to parse should score higher.

After calculating the weighted score, provide concise "reasoning" that justifies your score. This reasoning should summarize your findings for each of the three criteria (Skills, Experience, and Quality).

Finally, identify 3-5 important skills or keywords that are present in the job description but are missing from the resume. List these in the 'suggestedSkills' field. These suggestions should be actionable items the candidate could add to their resume (if applicable) to better align with the job posting.

If you cannot extract text from the image, your reasoning should state that the image was unreadable or not a valid resume, you must set the match score to 0, and the suggested skills array must be empty.

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
