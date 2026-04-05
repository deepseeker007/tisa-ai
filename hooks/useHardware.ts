'use client';

/**
 * useHardware — TISA Hardware Detection Hook
 *
 * Runs once on mount. Detects:
 *   Tier 1: window.ai (Chrome Gemini Nano)
 *   Tier 2: WebGPU adapter present
 *   Tier 3: CPU fallback
 *
 * Also checks GPU power level to select appropriate model size.
 */

import { useState, useEffect } from 'react';
import type { HardwareCaps } from '@/lib/types';

const DEFAULT_CAPS: HardwareCaps = {
  tier: 3,
  hasWindowAI: false,
  hasWebGPU: false,
  modelSize: 'tiny',
  cores: 4,
};

export function useHardware() {
  const [caps, setCaps] = useState<HardwareCaps>(DEFAULT_CAPS);
  const [detecting, setDetecting] = useState(true);

  useEffect(() => {
    detectHardware().then(c => {
      setCaps(c);
      setDetecting(false);
    });
  }, []);

  return { caps, detecting };
}

export async function detectHardware(): Promise<HardwareCaps> {
  const result: HardwareCaps = {
    ...DEFAULT_CAPS,
    cores: navigator.hardwareConcurrency ?? 4,
    memory: (navigator as any).deviceMemory ?? undefined,
  };

  // ── Tier 1: Chrome window.ai (Gemini Nano) ──────────────────
  if (typeof window !== 'undefined' && (window as any).ai) {
    try {
      const ai = (window as any).ai;
      // Probe that it actually works before committing
      const capabilities = await ai.canCreateTextSession?.();
      if (capabilities !== 'no') {
        result.hasWindowAI = true;
        result.tier = 1;
        result.modelSize = 'nano';
        return result;
      }
    } catch {
      // window.ai present but non-functional — fall through
    }
  }

  // ── Tier 2: WebGPU ──────────────────────────────────────────
  if (typeof navigator !== 'undefined' && (navigator as any).gpu) {
    try {
      const gpu = (navigator as any).gpu as GPU;
      const adapter = await gpu.requestAdapter({
        powerPreference: 'high-performance',
      });

      if (adapter) {
        result.hasWebGPU = true;
        result.tier = 2;

        const info = await adapter.requestAdapterInfo();
        result.gpuInfo = info.description || info.vendor;

        const isLowPower =
          info.description.toLowerCase().includes('llvmpipe') ||
          info.description.toLowerCase().includes('software') ||
          info.description.toLowerCase().includes('swiftshader') ||
          result.memory !== undefined && result.memory < 4;

        const isMobile =
          /Android|iPhone|iPad/i.test(navigator.userAgent);

        if (isLowPower || isMobile) {
          result.modelSize = 'small'; // Gemma-2-2B
        } else if ((result.memory ?? 8) >= 16) {
          result.modelSize = 'large'; // Llama-3-8B
        } else {
          result.modelSize = 'medium'; // Phi-3-mini
        }
        return result;
      }
    } catch {
      // WebGPU probing failed
    }
  }

  // ── Tier 3: CPU fallback ────────────────────────────────────
  result.tier = 3;
  result.modelSize = 'tiny'; // 4-bit quantized, ≤2B params
  return result;
}
