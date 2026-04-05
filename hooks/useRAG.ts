'use client';

/**
 * useRAG — TISA Local Retrieval-Augmented Generation
 *
 * Pipeline:
 *   1. PDF → pdfjs-dist extracts raw text
 *   2. Text → chunked (512 tokens, 64 overlap)
 *   3. Chunks → @xenova/transformers embeds locally (no server)
 *   4. Query → embed → cosine similarity → top-k chunks
 *   5. Top chunks injected as context into AI prompt
 *
 * All processing is 100% client-side.
 */

import { useCallback, useRef, useState } from 'react';
import { useIndexedDB } from './useIndexedDB';
import type { UploadedDoc } from '@/lib/types';

interface RAGResult {
  chunkText: string;
  score: number;
  docName: string;
  chunkIdx: number;
}

const CHUNK_SIZE = 512;   // characters per chunk
const CHUNK_OVERLAP = 64; // overlap between consecutive chunks
const TOP_K = 3;          // number of chunks to retrieve

export function useRAG() {
  const [indexing, setIndexing] = useState(false);
  const [indexProgress, setIndexProgress] = useState(0);
  const pipelineRef = useRef<any>(null);
  const db = useIndexedDB();

  // ── Lazy-load embedding pipeline ──────────────────────────
  async function getEmbedder() {
    if (pipelineRef.current) return pipelineRef.current;

    const { pipeline } = await import('@xenova/transformers');
    pipelineRef.current = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2', // 23MB, runs in browser
      { progress_callback: (p: any) => setIndexProgress(Math.round(p.progress ?? 0)) }
    );
    return pipelineRef.current;
  }

  // ── Extract text from PDF ──────────────────────────────────
  const extractPDFText = useCallback(async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdfjsLib = await import('pdfjs-dist');

    // Set worker src (required by pdfjs)
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs';

    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const textParts: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ');
      textParts.push(pageText);
    }

    return textParts.join('\n\n');
  }, []);

  // ── Chunk text ────────────────────────────────────────────
  function chunkText(text: string): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + CHUNK_SIZE, text.length);
      chunks.push(text.slice(start, end));
      start += CHUNK_SIZE - CHUNK_OVERLAP;
    }

    return chunks.filter(c => c.trim().length > 20); // skip tiny chunks
  }

  // ── Index a document ──────────────────────────────────────
  const indexDocument = useCallback(async (file: File): Promise<UploadedDoc> => {
    setIndexing(true);
    setIndexProgress(0);

    try {
      // 1. Extract text
      let text = '';
      if (file.type === 'application/pdf') {
        text = await extractPDFText(file);
      } else {
        text = await file.text(); // txt, md
      }

      // 2. Chunk
      const chunks = chunkText(text);

      // 3. Embed (load model lazily)
      const embedder = await getEmbedder();
      const vectors: number[][] = [];

      for (let i = 0; i < chunks.length; i++) {
        const output = await embedder(chunks[i], { pooling: 'mean', normalize: true });
        vectors.push(Array.from(output.data as Float32Array));
        setIndexProgress(Math.round((i / chunks.length) * 100));
      }

      // 4. Save to IndexedDB
      const doc: UploadedDoc = {
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        text,
        chunks,
        uploadedAt: Date.now(),
      };

      await db.saveDocument(doc);
      await db.saveEmbeddings(doc.id, chunks, vectors);

      return doc;
    } finally {
      setIndexing(false);
      setIndexProgress(100);
    }
  }, [db, extractPDFText]);

  // ── Retrieve relevant chunks for a query ──────────────────
  const retrieve = useCallback(async (
    query: string,
    docIds?: string[]
  ): Promise<RAGResult[]> => {
    const embedder = await getEmbedder();

    // Embed query
    const output = await embedder(query, { pooling: 'mean', normalize: true });
    const queryVec: number[] = Array.from(output.data as Float32Array);

    // Load documents
    const docs = await db.loadDocuments();
    const targetDocs = docIds
      ? docs.filter(d => docIds.includes(d.id))
      : docs;

    const results: RAGResult[] = [];

    for (const doc of targetDocs) {
      const embeddings = await db.loadEmbeddingsForDoc(doc.id);

      for (const emb of embeddings) {
        const score = cosineSimilarity(queryVec, emb.vector);
        results.push({
          chunkText: doc.chunks[emb.chunkIdx] ?? '',
          score,
          docName: doc.name,
          chunkIdx: emb.chunkIdx,
        });
      }
    }

    // Sort by score, return top-k
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_K);
  }, [db]);

  // ── Build RAG context string for prompt injection ──────────
  const buildContext = useCallback(async (query: string): Promise<string> => {
    const results = await retrieve(query);
    if (!results.length) return '';

    const sections = results.map((r, i) =>
      `[Source ${i + 1}: ${r.docName}]\n${r.chunkText}`
    ).join('\n\n---\n\n');

    return `RELEVANT CONTEXT FROM YOUR DOCUMENTS:\n\n${sections}\n\nUSER QUESTION: `;
  }, [retrieve]);

  return {
    indexDocument,
    retrieve,
    buildContext,
    indexing,
    indexProgress,
  };
}

// ── Cosine similarity between two vectors ─────────────────
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}
