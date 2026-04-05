'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useVoice } from '@/hooks/useVoice';

interface ChatInputProps {
  onSend: (text: string) => void;
  isGenerating: boolean;
  isThinking: boolean;
  onToggleThink: () => void;
  showToast: (msg: string) => void;
}

export function ChatInput({ onSend, isGenerating, isThinking, onToggleThink, showToast }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice
  const voice = useVoice({
    onFinal: (text) => { setValue(prev => `${prev} ${text}`.trim()); },
    onInterim: (text) => { /* could show live in UI */ },
    onError: showToast,
  });

  // Listen for quick-prompt events from welcome screen
  useEffect(() => {
    const handler = (e: Event) => {
      const prompt = (e as CustomEvent).detail;
      setValue(prompt);
      textareaRef.current?.focus();
      setTimeout(() => onSend(prompt), 50);
    };
    window.addEventListener('tisa:quick-prompt', handler);
    return () => window.removeEventListener('tisa:quick-prompt', handler);
  }, [onSend]);

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleSend() {
    if (!value.trim() || isGenerating) return;
    onSend(value.trim());
    setValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }

  function handleFileAttach(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    showToast(`Attached "${file.name}" — ask me anything about it`);
    setValue(prev => prev + (prev ? ' ' : '') + `[File: ${file.name}]`);
    // In production: dispatch to RAG pipeline
  }

  const canSend = value.trim().length > 0 && !isGenerating;
  const isVoiceActive = voice.isListening;

  return (
    <div style={{
      padding: '16px 24px 20px',
      background: 'var(--bg1)',
      borderTop: '1px solid var(--border)',
      flexShrink: 0,
    }}>
      <div style={{
        background: 'var(--bg2)',
        border: `1px solid ${isThinking ? 'rgba(124,106,247,0.4)' : 'var(--border-hover)'}`,
        borderRadius: 'var(--r-xl)',
        overflow: 'hidden',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        boxShadow: isThinking ? '0 0 0 3px rgba(124,106,247,0.1)' : 'none',
        animation: isGenerating ? 'thinkGlow 2s ease-in-out infinite' : 'none',
      }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '10px 14px 0' }}>
          {/* Think button */}
          <button
            className={`toolbar-btn${isThinking ? ' active think-glow' : ''}`}
            onClick={onToggleThink}
          >
            <ThinkIcon />
            Think
          </button>

          {/* Attach */}
          <button
            className="toolbar-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            <AttachIcon />
            Attach
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.md"
            style={{ display: 'none' }}
            onChange={handleFileAttach}
          />

          {/* Voice */}
          <button
            className={`toolbar-btn${isVoiceActive ? ' active' : ''}`}
            onClick={voice.toggle}
            style={isVoiceActive ? { animation: 'pulseRing 1.5s ease-out infinite', color: 'var(--red)', borderColor: 'rgba(248,113,113,0.3)' } : {}}
          >
            <MicIcon />
            {isVoiceActive ? 'Listening...' : 'Voice'}
          </button>
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => { setValue(e.target.value); autoResize(); }}
          onKeyDown={handleKeyDown}
          placeholder={voice.isListening ? 'Listening... speak now' : 'Ask anything...'}
          rows={1}
          style={{
            width: '100%',
            background: 'none',
            border: 'none',
            outline: 'none',
            padding: '10px 14px',
            fontFamily: 'var(--font-ui)',
            fontSize: 14,
            color: 'var(--text0)',
            resize: 'none',
            minHeight: 46,
            maxHeight: 160,
            lineHeight: 1.6,
            display: 'block',
          }}
        />

        {/* Footer row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px 10px' }}>
          <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
            {value.length > 0 ? value.length : ''}
          </span>

          <button
            onClick={handleSend}
            disabled={!canSend}
            style={{
              width: 32, height: 32,
              borderRadius: 10,
              background: canSend ? 'var(--accent)' : 'var(--bg4)',
              border: 'none',
              color: canSend ? 'white' : 'var(--text3)',
              cursor: canSend ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all var(--transition)',
              transform: canSend ? 'scale(1)' : 'scale(0.95)',
              animation: isVoiceActive ? 'pulseRing 1.5s ease-out infinite' : 'none',
            }}
          >
            <SendIcon />
          </button>
        </div>
      </div>

      {/* Engine status */}
      <div style={{ textAlign: 'center', marginTop: 8, fontSize: 11, color: 'var(--text3)' }}>
        TISA runs locally · no data sent to servers
      </div>
    </div>
  );
}

// Icons
const ip = { fill: 'none' as const, stroke: 'currentColor', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
function ThinkIcon() { return <svg width="12" height="12" viewBox="0 0 12 12" {...ip} strokeWidth="1"><path d="M6 1C3.79 1 2 2.79 2 5c0 1.4.7 2.64 1.76 3.4L3.87 10h4.26l.11-1.6C9.3 7.64 10 6.4 10 5c0-2.21-1.79-4-4-4z"/><path d="M4.5 10v1h3v-1"/></svg>; }
function AttachIcon() { return <svg width="12" height="12" viewBox="0 0 12 12" {...ip} strokeWidth="1"><path d="M2 9V3.5L4.5 1H9a1 1 0 011 1v7a1 1 0 01-1 1H3a1 1 0 01-1-1z"/><path d="M4 1v3h4"/></svg>; }
function MicIcon() { return <svg width="12" height="12" viewBox="0 0 12 12" {...ip} strokeWidth="1"><rect x="4" y="1" width="4" height="6" rx="2"/><path d="M2 6.5A4 4 0 0010 6.5M6 10v1.5"/></svg>; }
function SendIcon() { return <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor"><path d="M2 11L11 6.5 2 2v3.5l6.5 1L2 7.5V11z"/></svg>; }
