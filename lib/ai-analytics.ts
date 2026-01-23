import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { PDFParse } from 'pdf-parse';

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

interface AnalysisResult {
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

let analyticsModel: ChatOpenAI | null = null;

function getAnalyticsModel(): ChatOpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }
  
  if (!analyticsModel) {
    analyticsModel = new ChatOpenAI({
      modelName: 'gpt-4o', // Using GPT-4 for better analysis
      temperature: 0.3, // Lower temperature for more consistent analysis
      openAIApiKey: apiKey,
    });
  }
  return analyticsModel;
}

async function loadTrainingDocuments(): Promise<string> {
  try {
    const form3Dir = join(process.cwd(), 'public', 'form3');
    
    // Check if directory exists
    let files: string[] = [];
    try {
      files = readdirSync(form3Dir).filter(f => f.endsWith('.pdf'));
    } catch (dirError) {
      console.warn('Training documents directory not found:', form3Dir);
      return 'No training documents available. Analysis will proceed without training examples.';
    }
    
    if (files.length === 0) {
      console.warn('No PDF training documents found in form3 directory');
      return 'No training documents available. Analysis will proceed without training examples.';
    }
    
    const trainingData: string[] = [];
    
    for (const file of files.slice(0, 5)) { // Limit to 5 files to avoid token limits
      try {
        const filePath = join(form3Dir, file);
        const dataBuffer = readFileSync(filePath);
        const parser = new PDFParse({ data: dataBuffer });
        const pdfData = await parser.getText();
        const text = pdfData.text.trim();
        if (text.length > 0) {
          // Remove filename from training data to avoid AI focusing on reference numbers
          // Just include the content structure and information
          trainingData.push(`\n--- Example Form 3 Application (Training Example) ---\n${text.substring(0, 2000)}`); // Limit text per file
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.warn(`Failed to parse training PDF ${file}:`, error.message);
      }
    }
    
    if (trainingData.length === 0) {
      return 'Training documents found but could not be parsed. Analysis will proceed without training examples.';
    }
    
    return trainingData.join('\n\n');
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('Error loading training documents:', error);
    return 'Error loading training documents. Analysis will proceed without training examples.';
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
    
    console.log('Fetching document from URL:', fullUrl);
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(fullUrl, { 
      headers,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      return `Unable to fetch document from URL (${response.status}): ${response.statusText}`;
    }
    
    // Check if response is actually a PDF
    const contentType = response.headers.get('content-type') || '';
    if (contentType && 
        !contentType.includes('pdf') && 
        !contentType.includes('application/octet-stream') &&
        !contentType.includes('application/pdf')) {
      return `Document is not a PDF file (Content-Type: ${contentType}). Only PDF documents can be analyzed.`;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Check if buffer is empty
    if (buffer.length === 0) {
      return 'Document file is empty or could not be downloaded.';
    }
    
    const parser = new PDFParse({ data: buffer });
    const pdfData = await parser.getText();
    const text = pdfData.text.trim();
    
    if (text.length === 0) {
      return 'Document appears to be empty or contains no extractable text.';
    }
    
    return text.substring(0, 5000); // Limit text length
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('Document analysis error:', {
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
    throw new Error('OpenAI API key not configured');
  }

  const trainingData = await loadTrainingDocuments();
  
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
    const documentPromises = applicationData.documents.slice(0, 5).map(async (doc) => {
      const content = await analyzeDocument(doc.file_url, doc.document_type, userToken);
      return `\n--- Document: ${doc.filename} (${doc.document_type}) ---\n${content.substring(0, 2000)}`;
    });
    documentAnalyses = await Promise.all(documentPromises).then(results => results.join('\n\n'));
  }

  const systemPrompt = `You are an expert application reviewer for the Ministry of Works, Housing & Water Resources (MWHWR) in Ghana. 
Your task is to analyze contractor classification certificate applications and provide a comprehensive review.

TRAINING DATA (Examples of valid applications - IGNORE reference numbers, file names, or IDs in filenames):
${trainingData}

IMPORTANT: When analyzing training data:
- Focus on the STRUCTURE, CONTENT, and INFORMATION QUALITY of the documents
- IGNORE reference numbers, application IDs, or file names (e.g., "829", "773", etc.)
- Learn the PATTERNS of required information, formatting, and completeness
- Understand what constitutes a properly filled Form 3 based on CONTENT, not identifiers

APPLICATION TO REVIEW:
${applicationSummary}

DOCUMENT CONTENTS:
${documentAnalyses || 'No documents provided'}

ANALYSIS REQUIREMENTS:
1. Review the application against MWHWR standards and the training examples provided
2. Focus on CONTENT QUALITY and STRUCTURE, not reference numbers or IDs
3. Check completeness of:
   - Company information (name, registration, address, contact details)
   - Directors information (minimum requirements, completeness)
   - Required documents (Form 3, certificates, registration documents, etc.)
4. Verify document authenticity and compliance with training examples based on CONTENT STRUCTURE
5. Check for any inconsistencies or red flags in the INFORMATION provided
6. Assess overall compliance with ministry requirements based on SUBSTANCE, not identifiers

OUTPUT FORMAT (JSON):
{
  "verdict": "approve" | "reject" | "needs_review",
  "confidence": 0-100,
  "summary": "Brief 2-3 sentence summary of your assessment",
  "detailedReport": {
    "companyInfo": {
      "status": "complete" | "incomplete" | "issues",
      "findings": ["finding1", "finding2", ...]
    },
    "directors": {
      "status": "complete" | "incomplete" | "issues",
      "findings": ["finding1", "finding2", ...]
    },
    "documents": {
      "status": "complete" | "incomplete" | "issues",
      "findings": ["finding1", "finding2", ...],
      "documentAnalysis": [
        {
          "filename": "doc.pdf",
          "documentType": "form_3",
          "status": "valid" | "invalid" | "needs_review",
          "findings": ["finding1", ...]
        }
      ]
    },
    "compliance": {
      "status": "compliant" | "non_compliant" | "partial",
      "findings": ["finding1", "finding2", ...]
    }
  },
  "recommendations": ["recommendation1", "recommendation2", ...]
}

IMPORTANT:
- Be thorough but fair
- Base your analysis on the training examples provided
- Flag any discrepancies or missing information
- Provide actionable recommendations
- The verdict should reflect overall application quality, not just completeness
- "needs_review" means the application requires human review for clarification`;

  const messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage('Please analyze this application and provide your assessment in the specified JSON format.'),
  ];

  try {
    const response = await model.invoke(messages);
    const content = response.content as string;
    
    let analysisResult: AnalysisResult;
    
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      throw new Error('AI returned invalid response format');
    }

    return analysisResult;
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('AI Analysis Error:', error);
    throw error;
  }
}
