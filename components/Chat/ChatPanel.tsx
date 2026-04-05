'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { useAIEngine } from '@/hooks/useAIEngine';
import { useIndexedDB } from '@/hooks/useIndexedDB';
import { useHardware } from '@/hooks/useHardware';
import type { Dispatch, SetStateAction } from 'react';
import type { AppView, ArtifactTab, FlashCard, Message } from '@/lib/types';
import { generateId, extractCode, parseFlashcards } from '@/lib/utils';

interface ChatPanelProps {
  messages: Message[];
  setMessages: Dispatch<SetStateAction<Message[]>>;
  isThinking: boolean;
  setIsThinking: (v: boolean) => void;
  isGenerating: boolean;
  setIsGenerating: (v: boolean) => void;
  artifactVisible: boolean;
  setArtifactVisible: (v: boolean) => void;
  setArtifactTab: (t: ArtifactTab) => void;
  setFlashcards: (cards: FlashCard[]) => void;
  setArtifactCode: (code: string) => void;
  setArtifactNotes: (notes: string) => void;
  currentView: AppView;
  showToast: (msg: string) => void;
}

export function ChatPanel({
  messages, setMessages,
  isThinking, setIsThinking,
  isGenerating, setIsGenerating,
  artifactVisible, setArtifactVisible,
  setArtifactTab, setFlashcards, setArtifactCode, setArtifactNotes,
  currentView, showToast,
}: ChatPanelProps) {
  const { generate, loading } = useAIEngine();
  const { saveMessage } = useIndexedDB();
  const { caps } = useHardware();
  const [currentModel, setCurrentModel] = useState(0);
  const MODELS = ['Gemini Nano', 'Phi-3 Mini', 'Llama-3-8B', 'Gemma-2-2B'];

  const handleSend = useCallback(async (text: string) => {
    if (!text.trim() || isGenerating) return;

    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    saveMessage(userMsg);
    setIsGenerating(true);

    try {
      const aiResponse = await generate(text, { useReasoning: isThinking });

      const aiMsg: Message = {
        id: generateId(),
        role: 'ai',
        content: aiResponse.content,
        reasoning: aiResponse.reasoning,
        timestamp: Date.now(),
        model: aiResponse.model,
        tier: aiResponse.tier,
      };

      setMessages(prev => [...prev, aiMsg]);
      saveMessage(aiMsg);

      // Update artifact panel
      if (aiResponse.hasFlashcards && aiResponse.flashcards) {
        setFlashcards(aiResponse.flashcards);
        setArtifactTab('cards');
      } else if (aiResponse.hasCode && aiResponse.extractedCode) {
        setArtifactCode(aiResponse.extractedCode);
        setArtifactTab('code');
      } else {
        setArtifactNotes(aiResponse.content);
        setArtifactTab('workspace');
      }
    } catch (err) {
      showToast('Generation failed. Try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, isThinking, generate, setMessages, saveMessage, setIsGenerating, setFlashcards, setArtifactCode, setArtifactNotes, setArtifactTab, showToast]);

  const tierColors: Record<number, string> = { 1: 'var(--green)', 2: 'var(--accent2)', 3: 'var(--amber)' };
  const tier = caps?.tier ?? 3;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg1)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Model pill */}
          <button
            onClick={() => setCurrentModel(m => (m + 1) % MODELS.length)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '5px 10px',
              background: 'var(--bg3)',
              border: '1px solid var(--border-hover)',
              borderRadius: 20,
              fontSize: 12, color: 'var(--text1)',
              cursor: 'pointer', transition: 'all var(--transition)',
              fontFamily: 'var(--font-ui)',
            }}
          >
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: tierColors[tier],
              boxShadow: `0 0 6px ${tierColors[tier]}`,
            }} />
            {MODELS[currentModel]}
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
          </button>
          <span style={{ fontSize: 11, color: 'var(--teal)', fontFamily: 'var(--font-mono)' }}>
            tier-{tier}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Think toggle */}
          <button
            className={`icon-btn${isThinking ? ' active' : ''}`}
            onClick={() => {
              setIsThinking(!isThinking);
              showToast(isThinking ? 'Reasoning mode OFF' : 'Reasoning mode ON — TISA will show its thinking');
            }}
            title="Toggle reasoning mode"
          >
            <ThinkIcon />
          </button>

          {/* Toggle artifact */}
          <button
            className="icon-btn"
            onClick={() => setArtifactVisible(!artifactVisible)}
            title="Toggle Artifact Panel"
          >
            <SplitIcon />
          </button>

          {/* Clear */}
          <button
            className="icon-btn"
            onClick={() => { setMessages(() => []); showToast('Chat cleared'); }}
            title="Clear chat"
          >
            <XIcon />
          </button>
        </div>
      </div>

      {/* Messages */}
      <MessageList messages={messages} isGenerating={isGenerating} />

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        isGenerating={isGenerating}
        isThinking={isThinking}
        onToggleThink={() => setIsThinking(!isThinking)}
        showToast={showToast}
      />
    </div>
  );
}

// Icons
const ip = { width: 15, height: 15, viewBox: '0 0 15 15', fill: 'none' as const, stroke: 'currentColor', strokeWidth: '1', strokeLinecap: 'round' as const };
function ThinkIcon() { return <svg {...ip}><path d="M7.5 1C4.46 1 2 3.46 2 6.5c0 1.87.93 3.52 2.35 4.53L4.5 13h6l.15-1.97C12.07 10.02 13 8.37 13 6.5 13 3.46 10.54 1 7.5 1z"/><path d="M5.5 13v1.5h4V13"/></svg>; }
function SplitIcon() { return <svg {...ip}><rect x="1" y="1.5" width="13" height="12" rx="1.5"/><path d="M7 1.5v12"/></svg>; }
function XIcon() { return <svg {...ip}><path d="M3 3l9 9M12 3l-9 9"/></svg>; }
