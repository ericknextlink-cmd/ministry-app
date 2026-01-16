import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
// import { join } from 'path';
import chatData from '@/lib/chat-data.json';
import stringSimilarity from 'string-similarity';
import { chatConfig, getKnowledgeBasePath } from '@/lib/chat-config';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

// Initialize OpenAI client (will be lazy-loaded)
let chatModel: ChatOpenAI | null = null;

function getChatModel(): ChatOpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }
  
  if (!chatModel) {
    chatModel = new ChatOpenAI({
      modelName: 'gpt-3.5-turbo',
      temperature: 0.7,
      openAIApiKey: apiKey,
    });
  }
  return chatModel;
}

/**
 * Load knowledge base content from configured source
 */
function loadKnowledgeBase(): string {
  try {
    const path = getKnowledgeBasePath();
    const content = readFileSync(path, 'utf-8');
    return content;
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('Error loading knowledge base:', {
      message: error.message,
      stack: error.stack,
      path: getKnowledgeBasePath()
    });
    return '';
  }
}

/**
 * Load pattern guide from configured source
 */
function loadPatternGuide() {
  try {
    // For JSON files, we can import directly
    return chatData;
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('Error loading pattern guide:', {
      message: error.message,
      stack: error.stack
    });
    return { intents: [], default_response: 'I apologize, but I am having trouble accessing my knowledge base.' };
  }
}

/**
 * Try to match user message against pattern guide using fuzzy matching
 */
function tryPatternMatch(userMessage: string): string | null {
  const patternGuide = loadPatternGuide();
  const userMessageLower = userMessage.toLowerCase().trim();
  
  // Skip pattern matching for very long messages (likely need AI)
  if (userMessageLower.length > 100) {
    return null;
  }

  // Flatten patterns for string-similarity (excluding greeting for non-greeting queries)
  const allPatterns: { pattern: string; intentId: string }[] = [];
  const isLikelyGreeting = /^(hi|hello|hey|good (morning|afternoon|evening)|greetings)/i.test(userMessage);
  
  patternGuide.intents.forEach(intent => {
    // Only match greeting intent if it's clearly a greeting
    if (intent.id === 'greeting' && !isLikelyGreeting) {
      return;
    }
    
    intent.patterns.forEach(pattern => {
      allPatterns.push({ pattern: pattern.toLowerCase(), intentId: intent.id });
    });
  });

  // Find best match among all patterns
  const matches = stringSimilarity.findBestMatch(userMessageLower, allPatterns.map(p => p.pattern));
  const bestPatternMatch = matches.bestMatch;

  // Increased threshold for fuzzy matching - only match if very confident
  if (bestPatternMatch.rating > 0.65) {
    const matchedPatternObj = allPatterns[matches.bestMatchIndex];
    const intent = patternGuide.intents.find(i => i.id === matchedPatternObj.intentId);
    if (intent) {
      return intent.response;
    }
  }

  // More strict keyword fallback - require pattern to be a complete word or phrase
  // Skip if message is too complex (has multiple question words or is asking multiple things)
  const questionWords = ['which', 'what', 'how', 'when', 'where', 'why', 'who'];
  const questionWordCount = questionWords.filter(word => userMessageLower.includes(word)).length;
  
  // If message has multiple question words or is very long, it's likely complex - skip pattern matching
  if (questionWordCount > 1 || userMessageLower.length > 80) {
    return null;
  }

  for (const intent of patternGuide.intents) {
    // Skip greeting intent for non-greeting queries
    if (intent.id === 'greeting' && !isLikelyGreeting) {
      continue;
    }
    
    for (const pattern of intent.patterns) {
      const patternLower = pattern.toLowerCase();
      
      // For single-word patterns, require word boundary match
      if (!patternLower.includes(' ')) {
        const wordBoundaryRegex = new RegExp(`\\b${patternLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (wordBoundaryRegex.test(userMessageLower)) {
          // But skip if it's part of a longer phrase (e.g., "how much" shouldn't match just "how")
          if (patternLower.length < 4 && userMessageLower.split(/\s+/).length > 3) {
            continue;
          }
          return intent.response;
        }
      } else {
        // For multi-word patterns, require exact phrase match or all words present in order
        if (userMessageLower.includes(patternLower)) {
          return intent.response;
        }
      }
    }
  }

  return null;
}

/**
 * Generate AI response using LangChain with knowledge base context
 */
async function generateAIResponse(userMessage: string, history: Array<{ role: string; content: string }>): Promise<string> {
  const chatModel = getChatModel();
  if (!chatModel) {
    throw new Error('OpenAI API key not configured');
  }

  const knowledgeBase = loadKnowledgeBase();
  const patternGuide = loadPatternGuide();
  
  // Extract fee information from pattern guide for easy reference
  const feeResponses = patternGuide.intents
    .filter(i => i.id.startsWith('fees_'))
    .map(i => i.response)
    .join('\n\n');
  
  // Build system prompt with knowledge base context
  const systemPrompt = `You are Mavis, a helpful assistant for the Ministry of Works, Housing & Water Resources (MWHWR) in Ghana. 
Your role is to provide accurate information about contractor classification and certification processes.

CRITICAL INSTRUCTIONS:
1. You have access to TWO information sources:
   - KNOWLEDGE BASE: Contains detailed guidelines, procedures, and general information
   - PATTERN GUIDE: Contains specific data like fees, contact info, and quick reference responses
   
2. ALWAYS use BOTH sources to answer questions:
   - For general information, procedures, requirements: Use the KNOWLEDGE BASE
   - For specific fees, contact details, quick facts: Use the PATTERN GUIDE
   - Combine information from both sources when answering complex questions

3. When answering fee questions:
   - The PATTERN GUIDE contains the exact fee amounts - USE THESE
   - Reference the KNOWLEDGE BASE for context about fee structure and validity periods
   - Never say fees are not available - they are in the PATTERN GUIDE below

4. Answer format:
   - Be comprehensive and cite information from both sources
   - Use the exact fee amounts from the PATTERN GUIDE
   - Reference the KNOWLEDGE BASE for procedures and requirements
   - Be professional, accurate, and helpful

5. If information is truly not in either source, acknowledge this and provide what you can from available sources

KNOWLEDGE BASE (Guidelines and Procedures):
${knowledgeBase}

PATTERN GUIDE (Specific Data - Fees, Contact Info, Quick References):
${JSON.stringify(patternGuide.intents, null, 2)}

SPECIFIC FEE INFORMATION (for quick reference):
${feeResponses}

Remember: You are representing an official government ministry. Use ALL available information sources to provide complete, accurate answers.`;
  
  // Build conversation history
  const messages = [
    new SystemMessage(systemPrompt),
    ...history.slice(-5).map(msg => 
      msg.role === 'user' 
        ? new HumanMessage(msg.content)
        : new HumanMessage(`Assistant: ${msg.content}`)
    ),
    new HumanMessage(userMessage),
  ];

  const response = await chatModel.invoke(messages);
  return response.content as string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, history = [] } = body;

    if (!message) {
      return NextResponse.json({ response: "Please type a message." }, { status: 400 });
    }

    const userMessage = message.trim();
    
    // Step 1: Try pattern matching first (fast, prevents hallucination for common questions)
    const patternMatch = tryPatternMatch(userMessage);
    if (patternMatch) {
      return NextResponse.json({ response: patternMatch });
    }

    // Step 2: If no pattern match, use AI with knowledge base
    try {
      const chatModel = getChatModel();
      if (!chatModel) {
        console.warn('OpenAI API key not configured - falling back to pattern matching');
        const patternGuide = loadPatternGuide();
        return NextResponse.json({ 
          response: patternGuide.default_response + " Note: For detailed answers, please ensure the AI service is configured or contact the Classification Office directly."
        });
      }
      
      const aiResponse = await generateAIResponse(userMessage, history);
      return NextResponse.json({ response: aiResponse });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('AI generation error:', {
        message: error.message,
        stack: error.stack,
        userMessage: userMessage.substring(0, 50),
        historyLength: history.length
      });
      
      // Step 3: Fallback to default response if AI fails
      if (chatConfig.fallbackEnabled) {
        const patternGuide = loadPatternGuide();
        return NextResponse.json({ 
          response: patternGuide.default_response + " For detailed information, please contact the Classification Office directly at info@mofh.gov.gh or +233 784 787 58."
        });
      }
      
      return NextResponse.json({
        response: "I'm having trouble processing that right now. Please try again or contact the Classification Office directly at info@mofh.gov.gh or +233 784 787 58."
      }, { status: 500 });
    }

  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('Chat API Error:', {
      message: error.message,
      stack: error.stack
    });
    return NextResponse.json(
      { response: "I'm having trouble processing that right now. Please try again." },
      { status: 500 }
    );
  }
}
