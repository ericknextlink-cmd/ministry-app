import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { getSystemPrompt, getHumanMessage, getTrainingFallback, replaceTemplateVariables } from './prompts/config';

interface ApplicationData {
  id: number;
  certificate_type: string;
  certificate_class?: string;
  company_info: {
    company_name: string;
    registration_number: string;
    address: string;
    city: string;
    country: string;
    phone_number: string;
    email: string;
  } | null;
  directors: Array<{
    name: string;
    position: string;
    nationality: string;
    phone_number: string;
    email: string;
  }>;
  documents: Array<{
    filename: string;
    document_type: string;
    file_url: string;
  }>;
}

export interface AnalysisResult {
  verdict: 'approve' | 'reject' | 'needs_review';
  confidence: number;
  summary: string;
  detailedReport: {
    companyInfo: {
      status: 'complete' | 'incomplete' | 'issues';
      findings: string[];
    };
    directors: {
      status: 'complete' | 'incomplete' | 'issues';
      findings: string[];
    };
    documents: {
      status: 'complete' | 'incomplete' | 'issues';
      findings: string[];
      documentAnalysis: Array<{
        filename: string;
        documentType: string;
        status: 'valid' | 'invalid' | 'needs_review';
        findings: string[];
      }>;
    };
    compliance: {
      status: 'compliant' | 'non_compliant' | 'partial';
      findings: string[];
    };
  };
  recommendations: string[];
}

export interface AnalysisError {
  message: string;
  userMessage: string;
  code: string;
  retryable: boolean;
}

let analyticsModel: ChatOpenAI | null = null;

function getAnalyticsModel(): ChatOpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('[AI Analytics] OpenAI API key not configured');
    return null;
  }
  
  if (!analyticsModel) {
    try {
      analyticsModel = new ChatOpenAI({
        modelName: 'gpt-4o', // Using GPT-4 for better analysis
        temperature: 0.3, // Lower temperature for more consistent analysis
        openAIApiKey: apiKey,
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('[AI Analytics] Failed to initialize OpenAI model:', {
        message: error.message,
        stack: error.stack,
      });
      return null;
    }
  }
  return analyticsModel;
}

function createError(
  message: string,
  userMessage: string,
  code: string,
  retryable: boolean = true
): AnalysisError {
  return {
    message,
    userMessage,
    code,
    retryable,
  };
}

async function loadTrainingDocuments(): Promise<string> {
  try {
    // In production (serverless), file system access may be limited
    // Try to access training documents, but gracefully handle failures
    const form3Dir = join(process.cwd(), 'public', 'form3');
    
    // Check if directory exists
    let files: string[] = [];
    try {
      files = readdirSync(form3Dir).filter(f => f.endsWith('.pdf'));
    } catch (dirError) {
      // In production, this might fail due to read-only file system
      // Return a generic training message instead
      console.warn('[AI Analytics] Training documents directory not accessible:', form3Dir);
      return getTrainingFallback();
    }
    
    if (files.length === 0) {
      console.warn('[AI Analytics] No PDF training documents found in form3 directory');
      return getTrainingFallback();
    }
    
    const trainingData: string[] = [];
    
    for (const file of files.slice(0, 5)) { // Limit to 5 files to avoid token limits
      try {
        const filePath = join(form3Dir, file);
        const dataBuffer = readFileSync(filePath);
        
        // Add timeout protection for PDF parsing
        const parsePromise = (async () => {
          try {
            // Use LangChain PDFLoader for training documents (serverless-safe)
            const { PDFLoader } = await import('@langchain/community/document_loaders/fs/pdf');
            const loader = new PDFLoader(filePath);
            const docs = await loader.load();
            
            if (!docs || docs.length === 0) {
              return '';
            }
            
            // Extract text from all pages
            const text = docs.map((doc: { pageContent: string }) => doc.pageContent).join('\n\n').trim();
            return text;
          } catch (parseErr) {
            const error = parseErr instanceof Error ? parseErr : new Error(String(parseErr));
            console.warn(`[AI Analytics] Failed to parse PDF ${file}:`, error.message);
            return '';
          }
        })();
        
        const timeoutPromise = new Promise<string>((_, reject) => {
          setTimeout(() => reject(new Error('PDF parsing timeout')), 10000); // 10 second timeout per file
        });
        
        try {
          const text = await Promise.race([parsePromise, timeoutPromise]);
          
          if (text && text.length > 0) {
            // Remove filename from training data to avoid AI focusing on reference numbers
            // Just include the content structure and information
            trainingData.push(`\n--- Example Form 3 Application (Training Example) ---\n${text.substring(0, 2000)}`); // Limit text per file
          }
        } catch (timeoutErr) {
          console.warn(`[AI Analytics] PDF parsing timeout for ${file}`);
          // Continue with other files
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        // Log but continue with other files
        console.warn(`[AI Analytics] Failed to process training PDF ${file}:`, error.message);
        // Don't throw - continue processing other files
      }
    }
    
    if (trainingData.length === 0) {
      return getTrainingFallback();
    }
    
    return trainingData.join('\n\n');
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('[AI Analytics] Error loading training documents:', {
      message: error.message,
      stack: error.stack,
    });
    // Return a fallback training message instead of failing completely
    return getTrainingFallback();
  }
}

async function analyzeDocument(fileUrl: string, documentType: string, userToken?: string): Promise<string> {
  try {
    // Handle both full URLs and relative paths
    let fullUrl: string;
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      // Already a full URL - use as is
      fullUrl = fileUrl;
    } else if (fileUrl.startsWith('/')) {
      // Relative path starting with / - prepend backend URL
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      fullUrl = `${backendUrl}${fileUrl}`;
    } else {
      // Relative path without / - prepend backend URL with /
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      fullUrl = `${backendUrl}/${fileUrl}`;
    }
    
    const headers: HeadersInit = {};
    if (userToken) {
      headers['Authorization'] = `Bearer ${userToken}`;
    }
    
    console.log('[AI Analytics] Fetching document from URL:', fullUrl);
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(fullUrl, { 
      headers,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.warn(`[AI Analytics] Document fetch failed: ${response.status} ${response.statusText}`);
      return `Unable to fetch document from URL (${response.status}): ${response.statusText}`;
    }
    
    // Check if response is actually a PDF
    const contentType = response.headers.get('content-type') || '';
    if (contentType && 
        !contentType.includes('pdf') && 
        !contentType.includes('application/octet-stream') &&
        !contentType.includes('application/pdf')) {
      console.warn(`[AI Analytics] Document is not a PDF: ${contentType}`);
      return `Document is not a PDF file (Content-Type: ${contentType}). Only PDF documents can be analyzed.`;
    }
    
    // Fetch PDF bytes from Supabase signed URL
    const arrayBuffer = await response.arrayBuffer();
    const pdfBytes = new Uint8Array(arrayBuffer);
    
    // Check if buffer is empty
    if (pdfBytes.length === 0) {
      console.warn('[AI Analytics] Document buffer is empty');
      return 'Document file is empty or could not be downloaded.';
    }
    
    // Use LangChain PDFLoader - serverless-safe, no worker/canvas deps
    try {
      const { PDFLoader } = await import('@langchain/community/document_loaders/fs/pdf');
      
      // PDFLoader requires a file path, so write to temp file in serverless
      const { writeFileSync, unlinkSync } = await import('fs');
      const { join } = await import('path');
      const os = await import('os');
      const pdfBuffer = Buffer.from(pdfBytes);
      const tempPath = join(os.tmpdir(), `pdf-${Date.now()}-${Math.random().toString(36).substring(7)}.pdf`);
      
      let docs;
      try {
        // Write PDF bytes to temp file
        writeFileSync(tempPath, pdfBuffer);
        
        // Load PDF using LangChain PDFLoader (handles worker setup correctly)
        const loader = new PDFLoader(tempPath);
        docs = await loader.load();
      } finally {
        // Always clean up temp file
        try {
          unlinkSync(tempPath);
        } catch (cleanupErr) {
          console.warn('[AI Analytics] Failed to cleanup temp file:', cleanupErr);
        }
      }
      
      if (!docs || docs.length === 0) {
        throw new Error('No pages extracted from PDF');
      }
      
      // Extract text from all pages
      const rawText = docs.map((doc: { pageContent: string }) => doc.pageContent).join('\n\n').trim();
      
      if (rawText.length === 0) {
        throw new Error('No text extracted from PDF pages');
      }
      
      console.log(`[AI Analytics] Extracted ${docs.length} pages, ${rawText.length} chars from PDF`);
      
      // For RAG: Create Document, split, embed, and store in vector store
      // This enables semantic search and better context retrieval
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        console.warn('[AI Analytics] OpenAI API key not configured, using simple text extraction');
        return rawText.substring(0, 5000); // Limit text length
      }
      
      try {
        // Dynamically import LangChain modules for RAG
        const { Document } = await import('@langchain/core/documents');
        const { RecursiveCharacterTextSplitter } = await import('@langchain/textsplitters');
        const { OpenAIEmbeddings } = await import('@langchain/openai');
        // Create Document from parsed text
        const docs = [new Document({ 
          pageContent: rawText, 
          metadata: { source: fileUrl, documentType } 
        })];
        
        // Split document into chunks for better retrieval
        const splitter = new RecursiveCharacterTextSplitter({
          chunkSize: 1000,
          chunkOverlap: 200,
        });
        
        const splits = await splitter.splitDocuments(docs);
        
        // Create embeddings and vector store for semantic search
        const embeddings = new OpenAIEmbeddings({
          openAIApiKey: apiKey,
        });
        
        // Use FaissStore from @langchain/community (already installed, per LangChain docs)
        const { FaissStore } = await import('@langchain/community/vectorstores/faiss');
        const vectorStore = await FaissStore.fromDocuments(splits, embeddings);
        const retriever = vectorStore.asRetriever({ 
          k: 4 // Retrieve top 4 most relevant chunks
        });
        
        // Retrieve relevant chunks based on document type and key information
        const query = `Analyze this ${documentType} document for completeness, accuracy, and compliance with ministry requirements. Extract key information about company details, registration numbers, dates, and required certifications.`;
        const relevantDocs = await retriever.invoke(query);
        
        // Combine retrieved chunks for better context
        const retrievedText = relevantDocs.map((doc: { pageContent: string }) => doc.pageContent).join('\n\n');
        
        // Return the most relevant content (prioritize retrieved chunks, fallback to full text)
        const finalText = retrievedText.length > 0 
          ? retrievedText.substring(0, 5000)
          : rawText.substring(0, 5000);
        
        console.log(`[AI Analytics] Successfully analyzed document using RAG. Retrieved ${relevantDocs.length} relevant chunks.`);
        return finalText;
      } catch (ragError) {
        const error = ragError instanceof Error ? ragError : new Error(String(ragError));
        // If vector store not available, just use full text (not an error)
        if (error.message.includes('Vector store not available')) {
          console.log('[AI Analytics] Vector store not available, using full text extraction');
        } else {
          console.warn('[AI Analytics] RAG processing failed, using simple text extraction:', {
            message: error.message,
            stack: error.stack,
          });
        }
        // Fallback to simple text extraction if RAG fails
        return rawText.substring(0, 5000);
      }
    } catch (parseErr) {
      const error = parseErr instanceof Error ? parseErr : new Error(String(parseErr));
      console.error('[AI Analytics] LangChain PDFLoader failed:', {
        fileUrl,
        documentType,
        error: error.message,
        stack: error.stack,
      });
      
      // Final fallback: simple heuristic extraction (no deps, serverless-safe)
      try {
        const textContent = new TextDecoder().decode(pdfBytes);
        const extracted = textContent
          .replace(/\x00/g, '')  // Strip null bytes
          .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')  // Control chars
          .match(/[\s\S]{1,5000}/)?.[0] || '';  // First 5k printable chars
        
        if (extracted.length > 100) {
          console.warn('[AI Analytics] Using fallback text extraction (limited quality)');
          return extracted;
        }
      } catch (fallbackErr) {
        // Ignore fallback errors
      }
      
      return `Error parsing PDF document: ${error.message}. Please ensure the PDF is valid and accessible.`;
    }
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('[AI Analytics] Document analysis error:', {
      fileUrl,
      documentType,
      error: error.message,
      stack: error.stack,
    });
    
    // Provide more specific error messages
    if (error.name === 'AbortError' || error.message.includes('aborted') || error.message.includes('timeout')) {
      return `Document fetch timed out after 30 seconds. The document may be too large or the server is slow.`;
    }
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return `Failed to fetch document from URL. Please verify the document URL is accessible and the backend server is running.`;
    }
    if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      return `Cannot connect to document server. Please verify the backend URL is correct and accessible.`;
    }
    
    return `Error analyzing document: ${error.message}`;
  }
}

export async function analyzeApplication(
  applicationData: ApplicationData,
  userToken?: string
): Promise<AnalysisResult> {
  const model = getAnalyticsModel();
  if (!model) {
    const errorMsg = process.env.OPENAI_API_KEY 
      ? 'OpenAI API key is invalid or expired'
      : 'OpenAI API key not configured';
    console.error('[AI Analytics] Model initialization failed:', errorMsg);
    throw createError(
      errorMsg,
      'AI analysis service is not available. Please contact support or try again later.',
      'MODEL_INIT_ERROR',
      false
    );
  }

  // Load training data with error handling
  let trainingData: string;
  try {
    trainingData = await loadTrainingDocuments();
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('[AI Analytics] Failed to load training documents, using fallback:', {
      message: error.message,
      stack: error.stack,
    });
    trainingData = getTrainingFallback();
  }
  
  const applicationSummary = `
Application ID: ${applicationData.id}
Certificate Type: ${applicationData.certificate_type}
Certificate Class: ${applicationData.certificate_class || 'Not specified'}

Company Information:
${applicationData.company_info 
  ? `- Name: ${applicationData.company_info.company_name}
- Registration Number: ${applicationData.company_info.registration_number}
- Address: ${applicationData.company_info.address}, ${applicationData.company_info.city}, ${applicationData.company_info.country}
- Phone: ${applicationData.company_info.phone_number}
- Email: ${applicationData.company_info.email}`
  : 'Not provided'}

Directors (${applicationData.directors.length}):
${applicationData.directors.map((d, i) => `
${i + 1}. ${d.name}
   - Position: ${d.position}
   - Nationality: ${d.nationality}
   - Contact: ${d.email}, ${d.phone_number}
`).join('')}

Documents (${applicationData.documents.length}):
${applicationData.documents.map(d => `- ${d.filename} (${d.document_type})`).join('\n')}
`;

  let documentAnalyses = '';
  if (applicationData.documents.length > 0) {
    // Process documents with error handling - don't fail entire analysis if one document fails
    const documentPromises = applicationData.documents.slice(0, 5).map(async (doc) => {
      try {
        const content = await analyzeDocument(doc.file_url, doc.document_type, userToken);
        return `\n--- Document: ${doc.filename} (${doc.document_type}) ---\n${content.substring(0, 2000)}`;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error(`[AI Analytics] Failed to analyze document ${doc.filename}:`, {
          message: error.message,
          stack: error.stack,
        });
        return `\n--- Document: ${doc.filename} (${doc.document_type}) ---\n[Error: Could not analyze this document - ${error.message}]`;
      }
    });
    
    try {
      const results = await Promise.allSettled(documentPromises);
      documentAnalyses = results
        .map((result, index) => {
          if (result.status === 'fulfilled') {
            return result.value;
          } else {
            const doc = applicationData.documents[index];
            console.error(`[AI Analytics] Document analysis failed for ${doc?.filename}:`, {
              reason: result.reason,
            });
            return `\n--- Document: ${doc?.filename || 'Unknown'} ---\n[Error: Document analysis failed]`;
          }
        })
        .join('\n\n');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('[AI Analytics] Error processing documents:', {
        message: error.message,
        stack: error.stack,
      });
      documentAnalyses = 'Some documents could not be analyzed. Please review documents manually.';
    }
  }

  // Load and format system prompt
  let systemPrompt: string;
  try {
    const promptTemplate = getSystemPrompt();
    if (!promptTemplate) {
      console.warn('[AI Analytics] System prompt template not found, using fallback');
      systemPrompt = getTrainingFallback();
    } else {
      systemPrompt = replaceTemplateVariables(promptTemplate, {
        TRAINING_DATA: trainingData,
        APPLICATION_SUMMARY: applicationSummary,
        DOCUMENT_ANALYSES: documentAnalyses || 'No documents provided',
      });
    }
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('[AI Analytics] Failed to load system prompt:', {
      message: error.message,
      stack: error.stack,
    });
    systemPrompt = getTrainingFallback();
  }

  const humanMessage = getHumanMessage() || 'Please analyze this application and provide your assessment in the specified JSON format.';

  const messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage(humanMessage),
  ];

  try {
    // Add timeout for AI API call (5 minutes max)
    const invokePromise = model.invoke(messages);
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('AI analysis timeout - request took too long')), 300000); // 5 minutes
    });
    
    const response = await Promise.race([invokePromise, timeoutPromise]);
    const content = response.content as string;
    
    if (!content || typeof content !== 'string') {
      console.error('[AI Analytics] AI returned empty or invalid response');
      throw createError(
        'AI returned empty or invalid response',
        'The AI analysis service returned an invalid response. Please try again.',
        'INVALID_RESPONSE',
        true
      );
    }
    
    let analysisResult: AnalysisResult;
    
    try {
      // Try to extract JSON from response (AI might add markdown formatting)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        console.error('[AI Analytics] No JSON found in AI response');
        throw createError(
          'No JSON found in response',
          'The AI analysis service returned an unexpected format. Please try again.',
          'INVALID_JSON',
          true
        );
      }
      
      // Validate the result structure
      if (!analysisResult.verdict || !analysisResult.summary) {
        console.error('[AI Analytics] AI response missing required fields');
        throw createError(
          'AI response missing required fields',
          'The AI analysis service returned incomplete data. Please try again.',
          'INCOMPLETE_RESPONSE',
          true
        );
      }
      
      // Ensure confidence is a number
      if (typeof analysisResult.confidence !== 'number') {
        analysisResult.confidence = 50; // Default confidence
      }
      
    } catch (parseError) {
      const parseErr = parseError instanceof Error ? parseError : new Error(String(parseError));
      
      // Check if it's already an AnalysisError
      if ('code' in parseErr && 'userMessage' in parseErr) {
        throw parseErr;
      }
      
      console.error('[AI Analytics] Failed to parse AI response as JSON:', {
        error: parseErr.message,
        responsePreview: content.substring(0, 500),
      });
      throw createError(
        `AI returned invalid response format: ${parseErr.message}`,
        'The AI analysis service returned data in an unexpected format. Please try again.',
        'PARSE_ERROR',
        true
      );
    }

    return analysisResult;
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    
    // Check if it's already an AnalysisError
    if ('code' in error && 'userMessage' in error) {
      console.error('[AI Analytics] Analysis error:', {
        code: (error as any).code,
        message: error.message,
        retryable: (error as any).retryable,
      });
      throw error;
    }
    
    console.error('[AI Analytics] AI Analysis Error:', {
      message: error.message,
      stack: error.stack,
      applicationId: applicationData.id
    });
    
    // Provide more specific error messages
    if (error.message.includes('timeout')) {
      throw createError(
        'Analysis timed out',
        'The analysis request took too long to process. Please try again.',
        'TIMEOUT',
        true
      );
    }
    if (error.message.includes('API key') || error.message.includes('authentication')) {
      throw createError(
        'OpenAI API authentication failed',
        'AI analysis service authentication failed. Please contact support.',
        'AUTH_ERROR',
        false
      );
    }
    if (error.message.includes('rate limit') || error.message.includes('quota')) {
      throw createError(
        'OpenAI API rate limit exceeded',
        'The AI analysis service is currently busy. Please try again in a few minutes.',
        'RATE_LIMIT',
        true
      );
    }
    
    // Generic error
    throw createError(
      error.message || 'Failed to analyze application',
      'An unexpected error occurred during analysis. Please try again or contact support if the issue persists.',
      'UNKNOWN_ERROR',
      true
    );
  }
}
