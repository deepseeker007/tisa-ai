'use client';

/**
 * useAIEngine — TISA Multi-Tier AI Engine
 *
 * Architecture:
 *   Tier 1 → window.ai  (Chrome Gemini Nano, zero-latency)
 *   Tier 2 → WebLLM     (runs in a Web Worker via WebGPU)
 *   Tier 3 → CPU        (quantized wasm model, slowest)
 *
 * Callers just call `generate(prompt, options)` — tier
 * selection is automatic based on detected hardware.
 */

import { useCallback, useRef, useState } from 'react';
import { detectHardware } from './useHardware';
import type { AIResponse, HardwareCaps } from '@/lib/types';

interface GenerateOptions {
  useReasoning?: boolean;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  onStream?: (chunk: string) => void; // streaming callback
}

export function useAIEngine() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0); // for WebLLM model load
  const workerRef = useRef<Worker | null>(null);
  const capsRef = useRef<HardwareCaps | null>(null);

  // ── Lazy-initialise WebLLM worker (Tier 2) ────────────────────
  function getWorker(): Worker {
    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL('../workers/webllm.worker.ts', import.meta.url),
        { type: 'module' }
      );
    }
    return workerRef.current;
  }

  // ── Main generate function ────────────────────────────────────
  const generate = useCallback(async (
    userPrompt: string,
    opts: GenerateOptions = {}
  ): Promise<AIResponse> => {
    setLoading(true);
    setError(null);

    // Detect hardware once, cache it
    if (!capsRef.current) {
      capsRef.current = await detectHardware();
    }
    const caps = capsRef.current;

    const {
      useReasoning = false,
      systemPrompt = buildSystemPrompt(useReasoning),
      maxTokens = 1024,
      onStream,
    } = opts;

    try {
      let result: AIResponse;

      if (caps.tier === 1 && caps.hasWindowAI) {
        result = await generateWithWindowAI(userPrompt, systemPrompt, useReasoning);
      } else if (caps.tier === 2 && caps.hasWebGPU) {
        result = await generateWithWebLLM(
          userPrompt, systemPrompt, caps, maxTokens, onStream, setProgress, getWorker
        );
      } else {
        // Tier 3: CPU WASM fallback
        result = await generateWithCPU(userPrompt, systemPrompt, useReasoning);
      }

      return result;
    } catch (err: any) {
      // Graceful degradation: if Tier 1 fails, fall to Tier 2, etc.
      console.warn(`[TISA] Tier ${caps.tier} failed, degrading...`, err);
      capsRef.current = { ...caps, tier: Math.min(caps.tier + 1, 3) as 1|2|3 };
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { generate, loading, error, progress };
}

// ═══════════════════════════════════════════════════════
//  TIER 1 — window.ai (Chrome Gemini Nano)
// ═══════════════════════════════════════════════════════
async function generateWithWindowAI(
  prompt: string,
  systemPrompt: string,
  useReasoning: boolean
): Promise<AIResponse> {
  const ai = (window as any).ai;

  const session = await ai.createTextSession({
    systemPrompt,
    temperature: 0.7,
    topK: 40,
  });

  const fullPrompt = useReasoning
    ? `${prompt}\n\nPlease think step by step before your final answer.`
    : prompt;

  const rawResponse = await session.prompt(fullPrompt);
  session.destroy();

  const { reasoning, content } = parseReasoningBlock(rawResponse);

  return {
    content,
    reasoning: useReasoning ? reasoning : null,
    tier: 1,
    model: 'Gemini Nano',
    hasCode: content.includes('```'),
    hasFlashcards: /flashcard|flash card/i.test(content),
  };
}

// ═══════════════════════════════════════════════════════
//  TIER 2 — WebLLM via Web Worker
// ═══════════════════════════════════════════════════════
async function generateWithWebLLM(
  prompt: string,
  systemPrompt: string,
  caps: HardwareCaps,
  maxTokens: number,
  onStream?: (chunk: string) => void,
  setProgress?: (p: number) => void,
  getWorker?: () => Worker
): Promise<AIResponse> {
  // Select model based on hardware capability
  const modelId = selectWebLLMModel(caps.modelSize);

  return new Promise((resolve, reject) => {
    const worker = getWorker!();
    const requestId = Math.random().toString(36).slice(2);

    worker.postMessage({
      type: 'generate',
      id: requestId,
      modelId,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      maxTokens,
    });

    const handleMessage = (e: MessageEvent) => {
      const msg = e.data;
      if (msg.id !== requestId) return;

      if (msg.type === 'progress') {
        setProgress?.(msg.progress);
      } else if (msg.type === 'chunk' && onStream) {
        onStream(msg.chunk);
      } else if (msg.type === 'done') {
        worker.removeEventListener('message', handleMessage);
        const { reasoning, content } = parseReasoningBlock(msg.content);
        resolve({
          content,
          reasoning,
          tier: 2,
          model: modelId,
          hasCode: content.includes('```'),
          hasFlashcards: /flashcard|flash card/i.test(content),
        });
      } else if (msg.type === 'error') {
        worker.removeEventListener('message', handleMessage);
        reject(new Error(msg.error));
      }
    };

    worker.addEventListener('message', handleMessage);

    // Timeout after 60s
    setTimeout(() => {
      worker.removeEventListener('message', handleMessage);
      reject(new Error('WebLLM timeout'));
    }, 60_000);
  });
}

// ═══════════════════════════════════════════════════════
//  TIER 3 — CPU WASM fallback
// ═══════════════════════════════════════════════════════
async function generateWithCPU(
  prompt: string,
  _systemPrompt: string,
  useReasoning: boolean
): Promise<AIResponse> {
  /**
   * In production: dynamically import @xenova/transformers and run
   * a quantized model like DistilGPT2 or TinyLlama via transformers.js.
   *
   * const { pipeline } = await import('@xenova/transformers');
   * const generator = await pipeline('text-generation', 'Xenova/TinyLlama-1.1B-Chat-v1.0');
   * const output = await generator(messages, { max_new_tokens: 256 });
   */
  console.warn('[TISA] CPU tier: transformers.js would be invoked here');

  // Stub — replace with real transformers.js pipeline call
  const content = `[CPU Mode] I'm running in CPU fallback mode with a compressed model. ` +
    `For best results, use Chrome with WebGPU enabled.\n\n` +
    `Your prompt: "${prompt}"`;

  return {
    content,
    reasoning: useReasoning ? 'CPU reasoning trace: analysing prompt → generating response' : null,
    tier: 3,
    model: 'TinyLlama-1.1B (Q4)',
    hasCode: false,
    hasFlashcards: false,
  };
}

// ═══════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════

function buildSystemPrompt(useReasoning: boolean): string {
  const base = `You are TISA, a hyper-capable AI study companion, coding assistant, and productivity partner.
You excel at explaining complex topics, writing clean code, creating flashcards, and helping users study effectively.
Always use markdown formatting for clarity. Be concise but thorough.`;

  if (useReasoning) {
    return `${base}

When answering, first output a <think>...</think> block with your step-by-step reasoning,
then provide your final clear answer after it. Format the think block exactly like:
<think>
Step 1: ...
Step 2: ...
</think>`;
  }

  return base;
}

/** Extract <think>...</think> block from raw model output */
function parseReasoningBlock(raw: string): { reasoning: string | null; content: string } {
  const thinkMatch = raw.match(/<think>([\s\S]*?)<\/think>/i);
  if (thinkMatch) {
    const reasoning = thinkMatch[1].trim();
    const content = raw.replace(/<think>[\s\S]*?<\/think>/i, '').trim();
    return { reasoning, content };
  }
  return { reasoning: null, content: raw.trim() };
}

function selectWebLLMModel(size: HardwareCaps['modelSize']): string {
  switch (size) {
    case 'large':  return 'Llama-3-8B-Instruct-q4f32_1-MLC';
    case 'medium': return 'Phi-3-mini-4k-instruct-q4f32_1-MLC';
    case 'small':  return 'gemma-2-2b-it-q4f32_1-MLC';
    default:       return 'TinyLlama-1.1B-Chat-v1.0-q4f32_1-MLC';
  }
}
