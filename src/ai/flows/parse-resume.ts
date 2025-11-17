'use server';
/**
 * @fileOverview An AI agent that parses a resume and extracts key information.
 *
 * - parseResume - A function that handles the resume parsing process.
 * - ParseResumeInput - The input type for the parseResume function.
 * - ParseResumeOutput - The return type for the parseResume function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ParseResumeInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a resume, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ParseResumeInput = z.infer<typeof ParseResumeInputSchema>;

const ParseResumeOutputSchema = z.object({
  name: z.string().describe("The full name of the candidate."),
  phone: z.string().describe("The candidate's phone number."),
  skills: z.array(z.string()).describe("A list of the candidate's skills."),
  qualification: z.string().describe("The candidate's highest educational qualification."),
});
export type ParseResumeOutput = z.infer<typeof ParseResumeOutputSchema>;

export async function parseResume(input: ParseResumeInput): Promise<ParseResumeOutput | null> {
  return parseResumeFlow(input);
}

const parseResumePrompt = ai.definePrompt({
  name: 'parseResumePrompt',
  input: { schema: ParseResumeInputSchema },
  output: { schema: ParseResumeOutputSchema },
  prompt: `You are an expert resume parser. Your task is to accurately extract information from the provided resume image.

- **Resume Image:**
{{media url=photoDataUri}}

You must extract the following information:
1.  **name**: The full name of the candidate.
2.  **phone**: The primary contact phone number.
3.  **skills**: A list of key technical and soft skills.
4.  **qualification**: The highest level of education mentioned (e.g., "Bachelor of Science in Computer Science", "Master of Business Administration").

If you cannot extract text from the image, or a piece of information is not present, return an empty string for that field. For skills, return an empty array if none are found.

Return the response as a valid JSON object matching the output schema.
`,
});

const parseResumeFlow = ai.defineFlow(
  {
    name: 'parseResumeFlow',
    inputSchema: ParseResumeInputSchema,
    outputSchema: ParseResumeOutputSchema,
  },
  async (input) => {
    const { output } = await parseResumePrompt(input);
    
    if (!output) {
      throw new Error("The AI model failed to parse the resume. Please check the file and try again.");
    }
    
    return output;
  }
);
