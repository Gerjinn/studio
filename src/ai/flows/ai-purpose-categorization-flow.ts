'use server';
/**
 * @fileOverview This file implements a Genkit flow to automatically categorize a visitor's free-text
 * 'Other' purpose into a more specific library visit category or keep it as 'Other'.
 *
 * - categorizeVisitPurpose - An exported function that calls the Genkit flow.
 * - AIPurposeCategorizationInput - The input type for the flow.
 * - AIPurposeCategorizationOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

/**
 * Defines the input schema for the AI purpose categorization flow.
 * It expects a single string field for the visitor's free-text description.
 */
const AIPurposeCategorizationInputSchema = z.object({
  otherPurposeDescription: z
    .string()
    .describe(
      'The free-text description provided by the visitor when they select "Other" for their visit purpose.'
    ),
});

export type AIPurposeCategorizationInput = z.infer<
  typeof AIPurposeCategorizationInputSchema
>;

/**
 * Defines the output schema for the AI purpose categorization flow.
 * It returns the categorized purpose, which is one of the predefined specific categories
 * or 'Other' if no specific category is suitable.
 */
const AIPurposeCategorizationOutputSchema = z.object({
  categorizedPurpose: z
    .enum([
      'Assignment',
      'Use of Computer',
      'Board games',
      'Researching',
      'Reading',
      'Other', // Fallback if no specific category fits the description
    ])
    .describe(
      'The automatically categorized visit purpose based on the free-text description. If the description does not fit any specific category, "Other" is returned.'
    ),
});

export type AIPurposeCategorizationOutput = z.infer<
  typeof AIPurposeCategorizationOutputSchema
>;

/**
 * Defines a Genkit prompt for categorizing free-text visit purposes.
 * It instructs the LLM to classify the input description into a specific category.
 */
const categorizePurposePrompt = ai.definePrompt({
  name: 'categorizePurposePrompt',
  input: { schema: AIPurposeCategorizationInputSchema },
  output: { schema: AIPurposeCategorizationOutputSchema },
  prompt: `You are an AI assistant tasked with categorizing library visitor purposes.
A visitor selected 'Other' as their reason for visiting and provided the following description:

Description: {{{otherPurposeDescription}}}

Categorize this description into one of the following predefined categories:
- Assignment
- Use of Computer
- Board games
- Researching
- Reading
- Other (Use 'Other' if the description does not fit any of the specific categories above, or if you are unsure.)`,
});

/**
 * Defines the Genkit flow that orchestrates the AI purpose categorization process.
 * It takes the free-text description, passes it to the prompt, and returns the categorized purpose.
 */
const aiPurposeCategorizationFlow = ai.defineFlow(
  {
    name: 'aiPurposeCategorizationFlow',
    inputSchema: AIPurposeCategorizationInputSchema,
    outputSchema: AIPurposeCategorizationOutputSchema,
  },
  async (input) => {
    const { output } = await categorizePurposePrompt(input);
    // Ensure output is not null, as Genkit types allow it but it should always be present for successful prompts.
    if (!output) {
      throw new Error('Failed to categorize visit purpose: AI output was null.');
    }
    return output;
  }
);

/**
 * A wrapper function to execute the AI purpose categorization flow.
 * @param input The input containing the 'otherPurposeDescription' string.
 * @returns A promise that resolves to an object with the 'categorizedPurpose' string.
 */
export async function categorizeVisitPurpose(
  input: AIPurposeCategorizationInput
): Promise<AIPurposeCategorizationOutput> {
  return aiPurposeCategorizationFlow(input);
}
