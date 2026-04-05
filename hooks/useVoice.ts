'use client';

/**
 * useVoice — TISA Voice Input Hook
 *
 * Wraps the Web Speech API (SpeechRecognition).
 * Works natively in Chrome and Edge. No API keys needed.
 *
 * Features:
 *  - Continuous or single-shot mode
 *  - Interim results for live transcription feedback
 *  - Auto-stop after silence
 *  - Language selection
 */

import { useState, useRef, useCallback } from 'react';

type VoiceStatus = 'idle' | 'listening' | 'processing' | 'unsupported';

interface UseVoiceOptions {
  language?: string;         // e.g. 'en-US', 'hi-IN'
  continuous?: boolean;
  onInterim?: (text: string) => void;
  onFinal?: (text: string) => void;
  onError?: (err: string) => void;
}

export function useVoice(opts: UseVoiceOptions = {}) {
  const {
    language = 'en-US',
    continuous = false,
    onInterim,
    onFinal,
    onError,
  } = opts;

  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const start = useCallback(() => {
    if (!isSupported) {
      setStatus('unsupported');
      onError?.('Voice input is not supported in this browser. Try Chrome or Edge.');
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    const recognition: SpeechRecognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setStatus('listening');
      setTranscript('');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimText = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }

      if (interimText) {
        setTranscript(interimText);
        onInterim?.(interimText);
      }

      if (finalText) {
        setTranscript(finalText);
        onFinal?.(finalText);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const messages: Record<string, string> = {
        'no-speech': 'No speech detected. Try again.',
        'audio-capture': 'Microphone not found.',
        'not-allowed': 'Microphone access denied.',
        'network': 'Network error during voice recognition.',
      };
      const msg = messages[event.error] ?? `Recognition error: ${event.error}`;
      onError?.(msg);
      setStatus('idle');
    };

    recognition.onend = () => {
      setStatus(prev => prev === 'listening' ? 'idle' : prev);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported, language, continuous, onInterim, onFinal, onError]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setStatus('idle');
  }, []);

  const toggle = useCallback(() => {
    if (status === 'listening') stop();
    else start();
  }, [status, start, stop]);

  return {
    status,
    transcript,
    isSupported,
    isListening: status === 'listening',
    start,
    stop,
    toggle,
  };
}
