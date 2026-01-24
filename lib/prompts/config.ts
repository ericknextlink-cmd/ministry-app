/**
 * AI Analytics Prompts Configuration
 * 
 * This configuration manages prompt templates for the AI analysis system.
 * Similar to chat-config.ts, this allows easy modification of prompts without
 * changing the core logic.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

export interface PromptConfig {
  systemPrompt: string;
  humanMessage: string;
  trainingFallback: string;
}

/**
 * Load prompt from file
 */
function loadPrompt(filename: string): string {
  try {
    const promptPath = join(process.cwd(), 'lib', 'prompts', filename);
    return readFileSync(promptPath, 'utf-8').trim();
  } catch (err) {
    console.error(`Failed to load prompt file ${filename}:`, err);
    return '';
  }
}

/**
 * Get system prompt template
 */
export function getSystemPrompt(): string {
  return loadPrompt('system-prompt.txt');
}

/**
 * Get human message template
 */
export function getHumanMessage(): string {
  return loadPrompt('human-message.txt');
}

/**
 * Get training data fallback message
 */
export function getTrainingFallback(): string {
  return loadPrompt('training-fallback.txt');
}

/**
 * Replace template variables in prompt
 */
export function replaceTemplateVariables(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value);
  }
  return result;
}
