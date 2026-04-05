/**
 * TISA — Shared Utility Functions
 */

import type { FlashCard } from './types';

/** Generate a unique ID */
export function generateId(): string {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** Extract first code block from markdown string */
export function extractCode(markdown: string): string {
  const match = markdown.match(/```(?:\w+)?\n([\s\S]+?)```/);
  return match ? match[1].trim() : '';
}

/**
 * Parse AI-generated flashcard content into FlashCard objects.
 * Expects format like:
 *   Q: What is X?
 *   A: X is Y.
 */
export function parseFlashcards(content: string): FlashCard[] {
  const cards: FlashCard[] = [];

  // Pattern 1: Q: ... A: ...
  const qaPattern = /Q:\s*([\s\S]+?)\s*A:\s*([\s\S]+?)(?=Q:|$)/gi;
  let match;
  while ((match = qaPattern.exec(content)) !== null) {
    cards.push({
      id: generateId(),
      question: match[1].trim(),
      answer: match[2].trim(),
    });
  }

  if (cards.length) return cards;

  // Pattern 2: Numbered list — "1. Question | Answer"
  const numberedPattern = /^\d+\.\s+(.+?)\s+[|—]\s+(.+)$/gm;
  while ((match = numberedPattern.exec(content)) !== null) {
    cards.push({
      id: generateId(),
      question: match[1].trim(),
      answer: match[2].trim(),
    });
  }

  if (cards.length) return cards;

  // Pattern 3: **Bold question** followed by answer paragraph
  const boldPattern = /\*\*(.+?)\*\*\s*\n+([\s\S]+?)(?=\*\*|$)/g;
  while ((match = boldPattern.exec(content)) !== null) {
    const q = match[1].trim();
    const a = match[2].trim().replace(/\n/g, ' ');
    if (q && a) {
      cards.push({ id: generateId(), question: q, answer: a });
    }
  }

  return cards;
}

/** Format a timestamp as relative time */
export function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

/** Truncate text to a max length */
export function truncate(text: string, maxLen = 80): string {
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
}

/** Split text into chunks for RAG */
export function chunkText(text: string, size = 512, overlap = 64): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    chunks.push(text.slice(start, start + size));
    start += size - overlap;
  }
  return chunks.filter(c => c.trim().length > 20);
}

/** Cosine similarity between two float32 vectors */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/** Format bytes to human readable */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

/** Detect code language from snippet */
export function detectLanguage(code: string): string {
  if (/def |import |print\(|:$/.test(code)) return 'python';
  if (/function |const |let |=>/.test(code)) return 'javascript';
  if (/interface |: string|: number|React/.test(code)) return 'typescript';
  if (/fn |let mut|println!|use std/.test(code)) return 'rust';
  if (/func |package |fmt\./.test(code)) return 'go';
  if (/#include|std::/.test(code)) return 'cpp';
  if (/<\?php|echo /.test(code)) return 'php';
  return 'text';
}
