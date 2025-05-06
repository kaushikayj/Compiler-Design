
'use server';
/**
 * @fileOverview Provides an AI flow to explain analyzed code.
 *
 * - explainCode - A function that generates an explanation for source code based on its analysis results.
 * - ExplainCodeInput - The input type for the explainCode function.
 * - ExplainCodeOutput - The return type for the explainCode function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { Language, Token, ThreeAddressCode, Quadruple, SymbolTable } from '@/types/compiler';

// --- Input Schema ---
const TokenSchema = z.object({
    type: z.string(), // TokenType is complex, simplifying to string for schema
    value: z.string(),
    line: z.number().optional(),
    column: z.number().optional(),
});

const ThreeAddressCodeSchema = z.object({
    op: z.string(),
    arg1: z.string().nullable(),
    arg2: z.string().nullable(),
    result: z.string(),
});

const QuadrupleSchema = z.object({
    op: z.string(),
    arg1: z.string().nullable(),
    arg2: z.string().nullable(),
    result: z.string(),
});

const SymbolTableEntrySchema = z.object({
    name: z.string(),
    type: z.string(),
    scope: z.string(),
});

const SymbolTableSchema = z.record(z.string(), SymbolTableEntrySchema);

export const ExplainCodeInputSchema = z.object({
  language: z.enum(['c', 'cpp', 'java']).describe('The programming language of the source code.'),
  sourceCode: z.string().describe('The source code that was analyzed.'),
  tokens: z.array(TokenSchema).describe('The list of lexical tokens generated from the source code.'),
  threeAddressCode: z.array(ThreeAddressCodeSchema).optional().describe('The generated Three-Address Code (TAC).'),
  quadruples: z.array(QuadrupleSchema).optional().describe('The generated Quadruples.'),
  symbolTable: SymbolTableSchema.optional().describe('The generated Symbol Table.'),
});
export type ExplainCodeInput = z.infer<typeof ExplainCodeInputSchema>;


// --- Output Schema ---
export const ExplainCodeOutputSchema = z.object({
  explanation: z.string().describe('A comprehensive explanation of the code, referencing the provided analysis components (tokens, TAC, quads, symbol table). Explain the overall purpose, key structures, and how the intermediate representations relate to the source code.'),
});
export type ExplainCodeOutput = z.infer<typeof ExplainCodeOutputSchema>;


// --- Public Function ---
/**
 * Calls the Genkit flow to generate an explanation for the analyzed code.
 * @param input The analysis results and source code.
 * @returns A promise that resolves to the AI-generated explanation.
 */
export async function explainCode(input: ExplainCodeInput): Promise<ExplainCodeOutput> {
  return explainCodeFlow(input);
}


// --- Genkit Prompt Definition ---
const explainPrompt = ai.definePrompt({
  name: 'explainCodePrompt',
  input: { schema: ExplainCodeInputSchema },
  output: { schema: ExplainCodeOutputSchema },
  prompt: `You are an expert compiler design assistant and programmer. Your task is to explain a given piece of {{language}} source code based on its analysis results.

Here is the source code:
\`\`\`{{language}}
{{{sourceCode}}}
\`\`\`

Here are the analysis results:

**1. Tokens:**
{{#if tokens.length}}
\`\`\`json
{{{JSONstringify tokens}}}
\`\`\`
{{else}}
(No tokens provided or generated)
{{/if}}

**2. Three-Address Code (TAC):**
{{#if threeAddressCode.length}}
\`\`\`
{{{formatTAC threeAddressCode}}}
\`\`\`
{{else}}
(No TAC provided or generated)
{{/if}}

**3. Quadruples:**
{{#if quadruples.length}}
\`\`\`
{{{formatQuads quadruples}}}
\`\`\`
{{else}}
(No Quadruples provided or generated)
{{/if}}

**4. Symbol Table:**
{{#if symbolTable}}
\`\`\`json
{{{JSONstringify symbolTable}}}
\`\`\`
{{else}}
(No Symbol Table provided or generated)
{{/if}}

**Your Explanation Task:**

Provide a clear and concise explanation covering the following points:
*   **Overall Purpose:** What does the source code do?
*   **Key Structures:** Identify and briefly explain major programming constructs (loops, conditionals, functions, classes if applicable).
*   **Tokenization:** Briefly explain what tokens represent and mention any interesting or complex tokens found.
*   **Intermediate Code (TAC/Quads):** Explain the purpose of this representation. If provided, relate a small, simple segment of the intermediate code back to the original source code (e.g., how an assignment or simple operation is represented).
*   **Symbol Table:** Explain what the symbol table stores. If provided, mention a couple of entries and what they tell us about the code's variables or functions.
*   **Language Features:** Briefly mention any notable {{language}}-specific features used.

Structure your explanation clearly. Use markdown formatting for readability. Focus on explaining the provided information effectively.
`,
  // Define custom Handlebars helpers right within the prompt definition
  helpers: {
        JSONstringify: (context: any) => JSON.stringify(context, null, 2),
        formatTAC: (tac: ThreeAddressCode[]) => {
            if (!tac || tac.length === 0) return "(empty)";
            return tac.map((code, index) =>
                `${index + 1}: ${code.op}\t${code.arg1 ?? ' '}\t${code.arg2 ?? ' '}\t=> ${code.result}`
            ).join('\n');
        },
        formatQuads: (quads: Quadruple[]) => {
            if (!quads || quads.length === 0) return "(empty)";
            return quads.map((quad, index) =>
                 `${index}: (${quad.op}, ${quad.arg1 ?? '_'}, ${quad.arg2 ?? '_'}, ${quad.result})`
            ).join('\n');
        }
    }
});


// --- Genkit Flow Definition ---
const explainCodeFlow = ai.defineFlow(
  {
    name: 'explainCodeFlow',
    inputSchema: ExplainCodeInputSchema,
    outputSchema: ExplainCodeOutputSchema,
  },
  async (input) => {

    // Optionally, pre-process input data further if needed before passing to the prompt

    const { output } = await explainPrompt(input);

    if (!output) {
        throw new Error("AI failed to generate an explanation.");
    }

    return output;
  }
);
