// ═══════════════════════════════════════════════════════
//  TISA — SHARED TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════

export type AppView = 'chat' | 'vault' | 'timer' | 'settings' | 'profile';

export type ArtifactTab = 'workspace' | 'code' | 'cards';

export type AITier = 1 | 2 | 3;

export interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  reasoning?: string | null;
  timestamp: number;
  model?: string;
  tier?: AITier;
}

export interface FlashCard {
  id: string;
  question: string;
  answer: string;
  topic?: string;
  rating?: 'hard' | 'okay' | 'easy';
  nextReview?: number; // timestamp for spaced repetition
}

export interface HardwareCaps {
  tier: AITier;
  hasWindowAI: boolean;
  hasWebGPU: boolean;
  modelSize: 'nano' | 'tiny' | 'small' | 'medium' | 'large';
  gpuInfo?: string;
  cores: number;
  memory?: number;
}

export interface UploadedDoc {
  id: string;
  name: string;
  size: number;
  text: string;
  chunks: string[];
  embeddings?: number[][];
  uploadedAt: number;
}

export interface AIResponse {
  content: string;
  reasoning: string | null;
  tier: AITier;
  model: string;
  hasCode: boolean;
  hasFlashcards: boolean;
  extractedCode?: string;
  flashcards?: FlashCard[];
}

export interface TimerState {
  running: boolean;
  seconds: number;
  mode: 'focus' | 'break';
  sessionsCompleted: number;
}

export interface ModelInfo {
  id: string;
  name: string;
  tier: AITier;
  size: string;
  description: string;
  webllmId?: string; // e.g. 'Phi-3-mini-4k-instruct-q4f32_1-MLC'
}

export const AVAILABLE_MODELS: ModelInfo[] = [
  {
    id: 'gemini-nano',
    name: 'Gemini Nano',
    tier: 1,
    size: 'nano',
    description: 'Chrome built-in — fastest, zero download',
  },
  {
    id: 'phi3-mini',
    name: 'Phi-3 Mini',
    tier: 2,
    size: '2.3B',
    description: 'Microsoft — excellent reasoning',
    webllmId: 'Phi-3-mini-4k-instruct-q4f32_1-MLC',
  },
  {
    id: 'llama3-8b',
    name: 'Llama 3 8B',
    tier: 2,
    size: '8B',
    description: 'Meta — best quality, needs GPU',
    webllmId: 'Llama-3-8B-Instruct-q4f32_1-MLC',
  },
  {
    id: 'gemma2-2b',
    name: 'Gemma 2 2B',
    tier: 2,
    size: '2B',
    description: 'Google — balanced mobile',
    webllmId: 'gemma-2-2b-it-q4f32_1-MLC',
  },
];
