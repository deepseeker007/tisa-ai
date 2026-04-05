/**
 * webllm.worker.ts — TISA WebLLM Web Worker
 *
 * Runs WebLLM model inference in a dedicated worker thread,
 * keeping the main UI thread completely unblocked.
 *
 * Message protocol:
 *   IN:  { type: 'generate', id, modelId, messages, maxTokens }
 *   OUT: { type: 'progress', id, progress }     (model loading)
 *       { type: 'chunk',    id, chunk }          (streaming token)
 *       { type: 'done',     id, content }        (complete)
 *       { type: 'error',    id, error }          (failure)
 */

import { CreateMLCEngine, type MLCEngine } from '@mlc-ai/web-llm';

let engine: MLCEngine | null = null;
let loadedModelId: string | null = null;

self.addEventListener('message', async (event: MessageEvent) => {
  const { type, id, modelId, messages, maxTokens = 512 } = event.data;

  if (type !== 'generate') return;

  try {
    // ── Load model if needed ─────────────────────────────────
    if (!engine || loadedModelId !== modelId) {
      engine = await CreateMLCEngine(modelId, {
        initProgressCallback: (progress) => {
          self.postMessage({
            type: 'progress',
            id,
            progress: Math.round(progress.progress * 100),
            text: progress.text,
          });
        },
      });
      loadedModelId = modelId;
    }

    // ── Streaming generation ─────────────────────────────────
    const reply = await engine.chat.completions.create({
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
      stream: true,
    });

    let fullContent = '';

    for await (const chunk of reply) {
      const delta = chunk.choices[0]?.delta?.content ?? '';
      if (delta) {
        fullContent += delta;
        self.postMessage({ type: 'chunk', id, chunk: delta });
      }
    }

    self.postMessage({ type: 'done', id, content: fullContent });

  } catch (err: any) {
    self.postMessage({
      type: 'error',
      id,
      error: err?.message ?? 'Unknown WebLLM error',
    });
  }
});
