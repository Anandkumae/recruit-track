'use server';
/**
 * @fileOverview An AI agent that generates interview questions for a given job title.
 *
 * - generateInterviewQuestions - A function that generates interview questions.
 * - GenerateInterviewQuestionsInput - The input type for the function.
 * - GenerateInterviewQuestionsOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateInterviewQuestionsInputSchema = z.object({
  jobTitle: z.string().describe('The job title to generate interview questions for.'),
});
export type GenerateInterviewQuestionsInput = z.infer<typeof GenerateInterviewQuestionsInputSchema>;

const GenerateInterviewQuestionsOutputSchema = z.object({
  questions: z.array(z.string()).describe('A list of interview questions.'),
});
export type GenerateInterviewQuestionsOutput = z.infer<typeof GenerateInterviewQuestionsOutputSchema>;


export async function generateInterviewQuestions(input: GenerateInterviewQuestionsInput): Promise<GenerateInterviewQuestionsOutput> {
    return generateInterviewQuestionsFlow(input);
}


const prompt = ai.definePrompt({
    name: 'generateInterviewQuestionsPrompt',
    input: { schema: GenerateInterviewQuestionsInputSchema },
    output: { schema: GenerateInterviewQuestionsOutputSchema },
    prompt: `You are an expert hiring manager. Generate a list of 10 insightful interview questions for the following job title: {{{jobTitle}}}.

The questions should cover a range of topics, including technical skills, behavioral competencies, and situational judgment.`,
});


const generateInterviewQuestionsFlow = ai.defineFlow(
    {
        name: 'generateInterviewQuestionsFlow',
        inputSchema: GenerateInterviewQuestionsInputSchema,
        outputSchema: GenerateInterviewQuestionsOutputSchema,
    },
    async (input) => {
        const { output } = await prompt(input);
        
        if (!output) {
            throw new Error("The AI model failed to generate interview questions.");
        }

        return output;
    }
);
