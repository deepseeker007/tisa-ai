'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Message } from '@/lib/types';

interface MessageListProps {
  messages: Message[];
  isGenerating: boolean;
}

export function MessageList({ messages, isGenerating }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 24,
    }}>
      {/* Welcome screen */}
      {messages.length === 0 && !isGenerating && <WelcomeScreen />}

      {/* Messages */}
      <AnimatePresence initial={false}>
        {messages.map(msg => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          >
            {msg.role === 'user' ? (
              <UserMessage message={msg} />
            ) : (
              <AIMessage message={msg} />
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Typing indicator */}
      {isGenerating && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <AIAvatar />
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 6, height: 6,
                borderRadius: '50%',
                background: 'var(--accent)',
                animation: 'typingPulse 1.4s ease-in-out infinite',
                animationDelay: `${i * 0.2}s`,
              }} />
            ))}
          </div>
        </motion.div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

// ── Welcome screen ─────────────────────────────────────────
function WelcomeScreen() {
  const starters = [
    { icon: '◈', color: 'var(--accent)', bg: 'rgba(124,106,247,0.12)', title: 'Study Partner', desc: 'Explain with reasoning steps', prompt: 'Explain binary search with examples and walk me through the logic step by step' },
    { icon: '⌥', color: 'var(--teal)', bg: 'rgba(45,212,191,0.1)', title: 'Code Assistant', desc: 'Write, debug & explain code', prompt: 'Write a Python merge sort implementation with clear comments explaining each step' },
    { icon: '▦', color: 'var(--amber)', bg: 'rgba(245,158,11,0.1)', title: 'Flashcards', desc: 'Generate study cards instantly', prompt: 'Create flashcards for the Krebs cycle — 5 key concepts with clear Q&A format' },
    { icon: '⊕', color: 'var(--green)', bg: 'rgba(52,211,153,0.08)', title: 'Doc Vault', desc: 'Analyze notes & PDFs locally', prompt: 'How do I upload a PDF and ask questions about it?' },
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', gap: 32, minHeight: 400 }}>
      {/* Logo */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        style={{
          width: 56, height: 56,
          background: 'linear-gradient(135deg, var(--accent), var(--teal))',
          borderRadius: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 40px rgba(124,106,247,0.2), 0 0 80px rgba(45,212,191,0.08)',
        }}
      >
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none"><path d="M13 3L21 8V18L13 23L5 18V8L13 3Z" stroke="white" strokeWidth="1.2" fill="none"/><circle cx="13" cy="13" r="3.5" fill="white"/></svg>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{ textAlign: 'center' }}
      >
        <h2 style={{ fontSize: 24, fontWeight: 500, color: 'var(--text0)', letterSpacing: '-0.02em', marginBottom: 6 }}>Hello, I'm TISA</h2>
        <p style={{ fontSize: 14, color: 'var(--text2)', fontWeight: 300 }}>Your hyper-capable AI companion · Study · Code · Create</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, width: '100%', maxWidth: 520 }}
      >
        {starters.map((s, i) => (
          <StarterCard key={i} {...s} />
        ))}
      </motion.div>
    </div>
  );
}

function StarterCard({ icon, color, bg, title, desc, prompt }: any) {
  return (
    <motion.div
      whileHover={{ y: -2, borderColor: 'var(--border-hover)' }}
      whileTap={{ scale: 0.98 }}
      onClick={() => {
        // Dispatch a custom event to pre-fill input
        window.dispatchEvent(new CustomEvent('tisa:quick-prompt', { detail: prompt }));
      }}
      style={{
        padding: '14px 16px',
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div style={{
        width: 28, height: 28,
        borderRadius: 'var(--r-sm)',
        background: bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, color,
        marginBottom: 2,
      }}>{icon}</div>
      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text1)' }}>{title}</div>
      <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 300 }}>{desc}</div>
    </motion.div>
  );
}

// ── User message ───────────────────────────────────────────
function UserMessage({ message }: { message: Message }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <div style={{
        maxWidth: '80%',
        padding: '12px 16px',
        background: 'var(--bg3)',
        border: '1px solid var(--border-hover)',
        borderRadius: 'var(--r-lg)',
        borderBottomRightRadius: 4,
        fontSize: 14,
        color: 'var(--text0)',
        lineHeight: 1.65,
      }}>
        {message.content}
      </div>
    </div>
  );
}

// ── AI message ─────────────────────────────────────────────
function AIMessage({ message }: { message: Message }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Meta row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: 'var(--text3)', padding: '0 4px' }}>
        <AIAvatar />
        <span>TISA</span>
        {message.model && <span style={{ fontFamily: 'var(--font-mono)' }}>· {message.model}</span>}
      </div>

      {/* Reasoning block */}
      {message.reasoning && <ReasoningBlock reasoning={message.reasoning} />}

      {/* Content */}
      <div className="md-content" style={{ fontSize: 14, color: 'var(--text1)', lineHeight: 1.7 }}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ node, className, children, ...props }: any) {
              const isBlock = className?.startsWith('language-');
              const lang = className?.replace('language-', '') ?? '';
              if (isBlock) {
                return (
                  <div style={{ margin: '12px 0' }}>
                    <CodeHeader lang={lang} code={String(children)} />
                    <SyntaxHighlighter
                      style={oneDark}
                      language={lang || 'text'}
                      customStyle={{
                        margin: 0,
                        background: 'var(--bg2)',
                        border: '1px solid var(--border)',
                        borderTop: 'none',
                        borderRadius: '0 0 var(--r-md) var(--r-md)',
                        fontSize: 13,
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  </div>
                );
              }
              return <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, background: 'var(--bg3)', border: '1px solid var(--border-hover)', borderRadius: 4, padding: '1px 5px', color: 'var(--teal)' }}>{children}</code>;
            },
          }}
        >
          {message.content}
        </ReactMarkdown>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 4, padding: '2px 2px', marginTop: 2 }}>
        <button className="icon-btn" onClick={handleCopy} title="Copy" style={{ width: 24, height: 24 }}>
          {copied ? <CheckIcon /> : <CopyIcon />}
        </button>
      </div>
    </div>
  );
}

// ── Reasoning block ────────────────────────────────────────
function ReasoningBlock({ reasoning }: { reasoning: string }) {
  const [open, setOpen] = useState(false);
  const lines = reasoning.split('\n').filter(Boolean);

  return (
    <div style={{
      background: 'var(--bg2)',
      border: '1px solid var(--border)',
      borderLeft: '2px solid var(--accent)',
      borderRadius: 'var(--r-md)',
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px',
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 12, color: 'var(--accent2)', fontWeight: 500,
          fontFamily: 'var(--font-ui)',
          width: '100%', textAlign: 'left',
          letterSpacing: '0.02em',
        }}
      >
        <motion.span animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.15 }} style={{ display: 'inline-block' }}>
          <ChevronRightIcon />
        </motion.span>
        Reasoning trace
        <span style={{ marginLeft: 'auto', color: 'var(--text3)', fontSize: 10, fontFamily: 'var(--font-mono)' }}>
          {lines.length} steps
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 14px 12px', fontSize: 12, color: 'var(--text2)', fontFamily: 'var(--font-mono)', lineHeight: 1.7 }}>
              {reasoning}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Code header with copy ─────────────────────────────────
function CodeHeader({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 14px',
      background: 'var(--bg3)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-md) var(--r-md) 0 0',
      fontSize: 11, color: 'var(--text2)', fontFamily: 'var(--font-mono)',
    }}>
      <span>{lang || 'code'}</span>
      <button
        onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
        style={{ fontSize: 11, color: copied ? 'var(--green)' : 'var(--text2)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)', padding: '2px 6px', borderRadius: 4 }}
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}

function AIAvatar() {
  return (
    <div style={{ width: 20, height: 20, background: 'linear-gradient(135deg, var(--accent), var(--teal))', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 1L8 3V7L5 9L2 7V3L5 1Z" stroke="white" strokeWidth="0.8" fill="none"/><circle cx="5" cy="5" r="1.5" fill="white"/></svg>
    </div>
  );
}

const sip = { width: 11, height: 11, viewBox: '0 0 11 11', fill: 'none' as const, stroke: 'currentColor', strokeWidth: '0.9', strokeLinecap: 'round' as const };
function CopyIcon() { return <svg {...sip}><rect x="3.5" y="3.5" width="6" height="6" rx="1"/><path d="M1 7V1.5a.5.5 0 01.5-.5H7"/></svg>; }
function CheckIcon() { return <svg {...sip}><path d="M2 5.5l2.5 2.5 4.5-5"/></svg>; }
function ChevronRightIcon() { return <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2l4 4-4 4"/></svg>; }
