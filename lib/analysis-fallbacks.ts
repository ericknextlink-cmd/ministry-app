/**
 * Analysis fallbacks when the primary PDF analysis path (Python backend) cannot
 * analyze documents at all. Tries, in order: Supabase Hybrid Search RAG,
 * FAISS RAG, then raw LLM over extracted text.
 *
 * Supabase fallback requires: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (or
 * SUPABASE_PRIVATE_KEY). Run scripts/supabase-analysis-documents.sql in the
 * Supabase SQL Editor first. OPENAI_API_KEY required for all RAG/LLM paths.
 */

const ANALYSIS_LOG = '[Analysis Fallback]';

function resolvePdfUrl(fileUrl: string): string {
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) return fileUrl;
  const base = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
  return fileUrl.startsWith('/') ? `${base}${fileUrl}` : `${base}/${fileUrl}`;
}

async function parsePdfFromUrl(fileUrl: string, token?: string): Promise<{ text: string }> {
  const fullUrl = resolvePdfUrl(fileUrl);
  const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  const response = await fetch(fullUrl, { headers, signal: controller.signal });
  clearTimeout(timeoutId);

  if (!response.ok) throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
  const contentType = response.headers.get('content-type') || '';
  if (
    contentType &&
    !contentType.includes('pdf') &&
    !contentType.includes('application/octet-stream') &&
    !contentType.includes('application/pdf')
  ) {
    throw new Error(`Not a PDF: ${contentType}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const pdfBytes = new Uint8Array(arrayBuffer);
  if (pdfBytes.length === 0) throw new Error('PDF buffer empty');

  let rawText = '';
  let docs: { pageContent: string }[] = [];

  try {
    const { PDFLoader } = await import('@langchain/community/document_loaders/fs/pdf');
    const { writeFileSync, unlinkSync } = await import('fs');
    const { join } = await import('path');
    const os = await import('os');
    const tempPath = join(os.tmpdir(), `pdf-fb-${Date.now()}-${Math.random().toString(36).slice(2, 10)}.pdf`);
    try {
      writeFileSync(tempPath, Buffer.from(pdfBytes));
      const loader = new PDFLoader(tempPath);
      docs = await loader.load();
    } finally {
      try {
        unlinkSync(tempPath);
      } catch {
        /* ignore */
      }
    }
    if (docs?.length) rawText = docs.map((d) => d.pageContent).join('\n\n').trim();
  } catch (e1) {
    try {
      const buf = pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength);
      const blob = new Blob([buf as ArrayBuffer], { type: 'application/pdf' });
      const { WebPDFLoader } = await import('@langchain/community/document_loaders/web/pdf');
      const loader = new WebPDFLoader(blob);
      docs = await loader.load();
      if (docs?.length) rawText = docs.map((d) => d.pageContent).join('\n\n').trim();
    } catch (e2) {
      const decoded = new TextDecoder().decode(pdfBytes);
      const stripped = decoded
        .replace(/\x00/g, '')
        .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
      const match = stripped.match(/[\s\S]{1,5000}/);
      if (match && match[0].length > 100) rawText = match[0];
      else throw new Error('No text extracted from PDF');
    }
  }

  if (!rawText || rawText.length < 50) throw new Error('Insufficient text extracted from PDF');
  return { text: rawText };
}

async function runLlmAnalysis(documentType: string, content: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

  const { ChatOpenAI } = await import('@langchain/openai');
  const { HumanMessage, SystemMessage } = await import('@langchain/core/messages');
  const model = new ChatOpenAI({
    modelName: 'gpt-4o-mini',
    temperature: 0.2,
    openAIApiKey: apiKey,
  });

  const system = `You analyze ${documentType} documents for completeness, accuracy, and compliance with ministry requirements. Provide a concise 2–4 sentence assessment.`;
  const human = `Document type: ${documentType}\n\nExtracted content:\n${content.slice(0, 6000)}`;
  const out = await model.invoke([new SystemMessage(system), new HumanMessage(human)]);
  const text = typeof out?.content === 'string' ? out.content : String(out?.content ?? '');
  return text.trim() || 'No analysis produced.';
}

async function analyzeWithSupabaseHybridSearch(
  documentType: string,
  text: string,
  batchId: string
): Promise<string> {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_PRIVATE_KEY ||
    (process.env as Record<string, string>)['SUPABASE_PRIVATE_KEY'];
  if (!url || !key) throw new Error('Supabase not configured');

  const { createClient } = await import('@supabase/supabase-js');
  const { Document } = await import('@langchain/core/documents');
  const { RecursiveCharacterTextSplitter } = await import('@langchain/textsplitters');
  const { OpenAIEmbeddings } = await import('@langchain/openai');
  const { SupabaseVectorStore } = await import('@langchain/community/vectorstores/supabase');
  const { SupabaseHybridSearch } = await import('@langchain/community/retrievers/supabase');

  const client = createClient(url, key);
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

  const embeddings = new OpenAIEmbeddings({ openAIApiKey: apiKey });
  const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
  const ragDocs = [new Document({ pageContent: text, metadata: { source: 'fallback', documentType } })];
  const splits = await splitter.splitDocuments(ragDocs);
  const withMeta = splits.map((d) => ({
    ...d,
    metadata: { ...d.metadata, batch_id: batchId, documentType },
  }));

  const vectorStore = new SupabaseVectorStore(embeddings, {
    client,
    tableName: 'documents',
    queryName: 'match_documents',
  });
  const ids = await vectorStore.addDocuments(withMeta);

  try {
    const retriever = new SupabaseHybridSearch(embeddings, {
      client,
      tableName: 'documents',
      similarityQueryName: 'match_documents',
      keywordQueryName: 'kw_match_documents',
      similarityK: 4,
      keywordK: 4,
      metadata: { batch_id: batchId },
    } as { client: typeof client; metadata?: Record<string, string> });
    const query = `Analyze this ${documentType} for completeness, accuracy, and compliance. Extract company details, registration numbers, dates, certifications.`;
    const relevant = await retriever.invoke(query);
    const context = relevant.map((d) => d.pageContent).join('\n\n').slice(0, 5000);
    return runLlmAnalysis(documentType, context || text.slice(0, 5000));
  } finally {
    try {
      await vectorStore.delete({ ids });
    } catch (e) {
      console.warn(`${ANALYSIS_LOG} Cleanup Supabase docs failed:`, e);
    }
  }
}

async function analyzeWithFaiss(documentType: string, text: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

  const { Document } = await import('@langchain/core/documents');
  const { RecursiveCharacterTextSplitter } = await import('@langchain/textsplitters');
  const { OpenAIEmbeddings } = await import('@langchain/openai');
  const { FaissStore } = await import('@langchain/community/vectorstores/faiss');

  const embeddings = new OpenAIEmbeddings({ openAIApiKey: apiKey });
  const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
  const ragDocs = [new Document({ pageContent: text, metadata: { source: 'fallback', documentType } })];
  const splits = await splitter.splitDocuments(ragDocs);
  const vectorStore = await FaissStore.fromDocuments(splits, embeddings);
  const retriever = vectorStore.asRetriever({ k: 4 });
  const query = `Analyze this ${documentType} for completeness, accuracy, and compliance. Extract company details, registration numbers, dates, certifications.`;
  const relevant = await retriever.invoke(query);
  const context = relevant.map((d) => d.pageContent).join('\n\n').slice(0, 5000);
  return runLlmAnalysis(documentType, context || text.slice(0, 5000));
}

export interface AnalyzeDocumentFallbackResult {
  success: boolean;
  analysis?: string;
  error?: string;
}

/**
 * Fallback when the primary analysis path could not analyze the document at all.
 * Tries, in order: Supabase Hybrid Search RAG → FAISS RAG → raw LLM over text.
 */
export async function analyzeDocumentFallback(
  fileUrl: string,
  documentType: string,
  _filename: string,
  token?: string
): Promise<AnalyzeDocumentFallbackResult> {
  let text: string;
  try {
    const parsed = await parsePdfFromUrl(fileUrl, token);
    text = parsed.text;
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.warn(`${ANALYSIS_LOG} Parse failed:`, err.message);
    return { success: false, error: err.message };
  }

  const batchId = `analysis-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  try {
    const analysis = await analyzeWithSupabaseHybridSearch(documentType, text, batchId);
    return { success: true, analysis };
  } catch (e1) {
    console.warn(`${ANALYSIS_LOG} Supabase hybrid failed:`, e1 instanceof Error ? e1.message : e1);
  }

  try {
    const analysis = await analyzeWithFaiss(documentType, text);
    return { success: true, analysis };
  } catch (e2) {
    console.warn(`${ANALYSIS_LOG} FAISS RAG failed:`, e2 instanceof Error ? e2.message : e2);
  }

  try {
    const analysis = await runLlmAnalysis(documentType, text.slice(0, 6000));
    return { success: true, analysis };
  } catch (e3) {
    const err = e3 instanceof Error ? e3 : new Error(String(e3));
    console.warn(`${ANALYSIS_LOG} Raw LLM failed:`, err.message);
    return { success: false, error: err.message };
  }
}
