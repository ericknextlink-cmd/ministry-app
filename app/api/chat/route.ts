import { NextRequest, NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import fs from "fs";
import path from "path";

// Load knowledge base from guidelines file
function loadKnowledgeBase(): string {
  try {
    const filePath = path.join(process.cwd(), "public", "docuemnts", "guidelines.txt");
    const content = fs.readFileSync(filePath, "utf-8");
    return content;
  } catch (error) {
    console.error("Error loading knowledge base:", error);
    return "";
  }
}

const knowledgeBase = loadKnowledgeBase();

const systemPrompt = `You are Mavis, a helpful and friendly AI assistant for the Ministry of Works, Housing & Water Resources (MWHWR) in Ghana. Your role is to assist users with questions about contractor certification, classification, and the application process.

Your name is Mavis.

You are the official support agent for the Ministry's Classification Application Portal. You help users understand:
- Certification and classification processes
- Application requirements and procedures
- Document requirements
- Fees and renewal processes
- Categories and classes (D, K, E, G)
- Compliance and monitoring requirements
- Appeals and grievances procedures

Use the following knowledge base to answer questions accurately. If you don't know something based on the knowledge base, politely say you don't have that information and suggest contacting the Classification Office directly.

Knowledge Base:
${knowledgeBase}

Always be professional, courteous, and helpful. Respond in a clear and concise manner. If asked about your name, say "I'm Mavis, your assistant for the Ministry of Works, Housing & Water Resources."`;

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key is not configured" },
        { status: 500 }
      );
    }

    const llm = new ChatOpenAI({
      modelName: "gpt-3.5-turbo",
      temperature: 0.7,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    // Build conversation history
    const messageHistory = [
      ["system", systemPrompt],
      ...(history || []).map((msg: { role: string; content: string }) => [
        msg.role === "user" ? "user" : "assistant",
        msg.content,
      ]),
      ["user", message],
    ];

    const prompt = ChatPromptTemplate.fromMessages(messageHistory);
    const chain = prompt.pipe(llm).pipe(new StringOutputParser());

    const response = await chain.invoke({});

    return NextResponse.json({ response });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}

