/**
 * Chatbot Data Source Configuration
 * 
 * This configuration allows easy switching between different data sources
 * for the chatbot knowledge base. To change the data source, simply update
 * the paths below or switch to a different source type.
 */

import { join } from 'path';

export interface ChatDataSource {
  type: 'file' | 'url' | 'database' | 'api';
  path: string;
  format: 'markdown' | 'json' | 'text' | 'pdf';
}

export interface ChatConfig {
  knowledgeBase: ChatDataSource;
  patternGuide: ChatDataSource;
  fallbackEnabled: boolean;
}

/**
 * Current Configuration
 * 
 * HOW TO CHANGE DATA SOURCES:
 * 
 * 1. To change the knowledge base (guidelines):
 *    - File-based (current): Update the 'path' field (e.g., '/public/docuemnts/guidelines.md')
 *    - URL-based: Change type to 'url' and path to full URL (e.g., 'https://example.com/guidelines.md')
 *    - Database: Change type to 'database' and path to connection string
 *    - API: Change type to 'api' and path to endpoint URL
 * 
 * 2. To change the pattern guide:
 *    - Same options as above, but typically kept as JSON file
 * 
 * 3. To disable AI fallback:
 *    - Set 'fallbackEnabled' to false (chatbot will only use pattern matching)
 * 
 * EXAMPLE: Switching to a URL-based knowledge base
 * knowledgeBase: {
 *   type: 'url',
 *   path: 'https://your-cdn.com/guidelines.md',
 *   format: 'markdown',
 * }
 */
export const chatConfig: ChatConfig = {
  // Main knowledge base - contains detailed guidelines and information
  knowledgeBase: {
    type: 'file',
    path: '/public/docuemnts/guidelines.md',
    format: 'markdown',
  },
  
  // Pattern guide - contains quick response patterns to prevent hallucination
  patternGuide: {
    type: 'file',
    path: '/lib/chat-data.json',
    format: 'json',
  },
  
  // Enable fallback to pattern matching if AI response fails
  fallbackEnabled: true,
};

/**
 * Helper function to resolve the actual file path based on config
 */
export function resolveDataSourcePath(source: ChatDataSource): string {
  if (source.type === 'file') {
    // For Next.js, resolve paths relative to project root
    if (source.path.startsWith('/public/')) {
      // Remove /public prefix and use public directory
      const relativePath = source.path.replace('/public/', '');
      return join(process.cwd(), 'public', relativePath);
    }
    if (source.path.startsWith('/lib/')) {
      // Remove /lib prefix and use lib directory
      const relativePath = source.path.replace('/lib/', '');
      return join(process.cwd(), 'lib', relativePath);
    }
    // Absolute path or relative to project root
    return join(process.cwd(), source.path);
  }
  
  // For other types, return as-is (URL, connection string, etc.)
  return source.path;
}

/**
 * Get the knowledge base file path
 */
export function getKnowledgeBasePath(): string {
  return resolveDataSourcePath(chatConfig.knowledgeBase);
}

/**
 * Get the pattern guide file path
 */
export function getPatternGuidePath(): string {
  return resolveDataSourcePath(chatConfig.patternGuide);
}
