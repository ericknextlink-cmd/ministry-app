import { NextResponse } from 'next/server';

export const runtime = 'edge'; // Optional: Use edge runtime for speed if desired, or keep default

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, history = [] } = body;

    if (!message) {
      return NextResponse.json({ response: "Please type a message." }, { status: 400 });
    }

    // AI Service Configuration
    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:7860';
    const AI_SERVICE_API_KEY = process.env.SERVICE_API_KEY || 'mwhwr_secret_microservice_key_2026';

    // Call the external AI Microservice
    const response = await fetch(`${AI_SERVICE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': AI_SERVICE_API_KEY,
      },
      body: JSON.stringify({
        message: message.trim(),
        history: history,
      }),
    });

    if (!response.ok) {
      console.error('AI Service Chat Error:', response.status, response.statusText);
      return NextResponse.json(
        { response: "I'm having trouble connecting to my knowledge base right now. Please try again later." },
        { status: 502 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('Chat API Proxy Error:', error.message);
    return NextResponse.json(
      { response: "An unexpected error occurred. Please contact support." },
      { status: 500 }
    );
  }
}