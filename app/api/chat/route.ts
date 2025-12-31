import { NextResponse } from 'next/server';
import chatData from '@/lib/chat-data.json';
import stringSimilarity from 'string-similarity';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json({ response: "Please type a message." }, { status: 400 });
    }

    const userMessage = message.toLowerCase();
    
    // 1. Direct Pattern Matching (High Priority)
    let bestMatch = null;
    let highestScore = 0;

    // Flatten patterns for string-similarity
    const allPatterns: { pattern: string; intentId: string }[] = [];
    chatData.intents.forEach(intent => {
        intent.patterns.forEach(pattern => {
            allPatterns.push({ pattern: pattern.toLowerCase(), intentId: intent.id });
        });
    });

    // Find best match among all patterns
    const matches = stringSimilarity.findBestMatch(userMessage, allPatterns.map(p => p.pattern));
    const bestPatternMatch = matches.bestMatch;

    if (bestPatternMatch.rating > 0.4) { // Threshold for fuzzy match
        const matchedPatternObj = allPatterns[matches.bestMatchIndex];
        const intent = chatData.intents.find(i => i.id === matchedPatternObj.intentId);
        if (intent) {
            return NextResponse.json({ response: intent.response });
        }
    }

    // 2. Keyword Fallback (if fuzzy fail)
    for (const intent of chatData.intents) {
        for (const pattern of intent.patterns) {
            if (userMessage.includes(pattern)) {
                return NextResponse.json({ response: intent.response });
            }
        }
    }

    return NextResponse.json({ response: chatData.default_response });

  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { response: "I'm having trouble processing that right now. Please try again." },
      { status: 500 }
    );
  }
}