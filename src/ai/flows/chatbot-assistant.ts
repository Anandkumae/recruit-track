
'use server';
/**
 * @fileOverview A chatbot assistant for the LeoRecruit platform.
 *
 * - chatbotAssistant - The main flow for handling chat conversations.
 * - ChatbotAssistantInput - The input type for the chatbot.
 * - ChatbotAssistantOutput - The return type for the chatbot.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { Message, Part } from 'genkit';

const ChatbotAssistantInputSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'model']),
      content: z.array(z.object({ text: z.string() })),
    })
  ),
});
export type ChatbotAssistantInput = z.infer<typeof ChatbotAssistantInputSchema>;

const ChatbotAssistantOutputSchema = z.object({
  response: z.string(),
});
export type ChatbotAssistantOutput = z.infer<typeof ChatbotAssistantOutputSchema>;

// Map the input schema to the Message[] type expected by Genkit
function mapToGenkitMessages(input: ChatbotAssistantInput): Message[] {
  return input.messages.map(
    (msg) => new Message(msg.role, msg.content as Part[])
  );
}

const systemPrompt = `You are Leo, a friendly and helpful AI assistant for the LeoRecruit platform. Your goal is to assist users with their hiring and job-seeking needs.

- Be conversational and encouraging.
- If you don't know the answer to something, say so politely.
- Keep your responses concise and to the point.
- For now, you can answer general questions about the platform. You do not yet have access to user-specific data or the ability to perform actions. Inform the user of this if they ask you to do something you can't.`;

export async function chatbotAssistant(
  input: ChatbotAssistantInput
): Promise<ChatbotAssistantOutput> {
  const llm = ai.getModel();

  const history = mapToGenkitMessages(input);

  const response = await llm.generate({
    history,
    system: systemPrompt,
  });

  return { response: response.text };
}
