'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlashcardView } from './FlashcardView';
import { CodeView } from './CodeView';
import type { ArtifactTab, AppView, FlashCard } from '@/lib/types';

interface ArtifactPanelProps {
  tab: ArtifactTab;
  setTab: (t: ArtifactTab) => void;
  flashcards: FlashCard[];
  code: string;
  notes: string;
  currentView: AppView;
  showToast: (msg: string) => void;
}

export function ArtifactPanel({ tab, setTab, flashcards, code, notes, currentView, showToast }: ArtifactPanelProps) {
  function handleCopy() {
    const text = tab === 'code' ? code : notes;
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard');
  }

  function handleDownload() {
    const text = tab === 'code' ? code : notes;
    const ext = tab === 'code' ? 'py' : 'md';
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `tisa-artifact.${ext}`;
    a.click();
    showToast('Downloaded');
  }

  const hasContent = (tab === 'code' && code) || (tab === 'cards' && flashcards.length) || (tab === 'workspace' && notes);

  return (
    <motion.aside
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 20, opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        width: 'var(--artifact-w)',
        minWidth: 320,
        background: 'var(--bg1)',
        borderLeft: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        {/* Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'var(--bg3)', borderRadius: 'var(--r-md)', padding: 3 }}>
          {(['workspace', 'code', 'cards'] as ArtifactTab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '5px 12px',
                borderRadius: 7,
                fontSize: 12,
                color: tab === t ? 'var(--text0)' : 'var(--text2)',
                background: tab === t ? 'var(--bg1)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-ui)',
                transition: 'all var(--transition)',
                boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
                whiteSpace: 'nowrap' as const,
              }}
            >
              {t === 'workspace' ? 'Workspace' : t === 'code' ? 'Code' : 'Flashcards'}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 4 }}>
          {hasContent && (
            <>
              <button className="icon-btn" onClick={handleCopy} title="Copy">
                <CopyIcon />
              </button>
              <button className="icon-btn" onClick={handleDownload} title="Download">
                <DownloadIcon />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ height: '100%' }}
          >
            {tab === 'workspace' && (notes ? <WorkspaceView notes={notes} /> : <EmptyState tab="workspace" />)}
            {tab === 'code' && (code ? <CodeView code={code} showToast={showToast} /> : <EmptyState tab="code" />)}
            {tab === 'cards' && (flashcards.length ? <FlashcardView cards={flashcards} showToast={showToast} /> : <EmptyState tab="cards" />)}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Status bar */}
      <div style={{
        padding: '8px 16px',
        borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 11, color: 'var(--text3)',
        fontFamily: 'var(--font-mono)',
        flexShrink: 0, background: 'var(--bg0)',
      }}>
        <StatusDot color="green" />
        <span>Ready</span>
        <div style={{ width: 1, height: 10, background: 'var(--border)' }} />
        <span>IndexedDB ✓</span>
        <div style={{ width: 1, height: 10, background: 'var(--border)' }} />
        <span>{typeof navigator !== 'undefined' && (navigator as any).gpu ? 'WebGPU ✓' : 'CPU mode'}</span>
      </div>
    </motion.aside>
  );
}

// ── Workspace notes view ───────────────────────────────────
function WorkspaceView({ notes }: { notes: string }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <NoteIcon />
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text1)' }}>Response Notes</span>
      </div>
      <div
        className="md-content"
        style={{ fontSize: 13, color: 'var(--text1)', lineHeight: 1.7 }}
        dangerouslySetInnerHTML={{ __html: simpleMarkdown(notes) }}
      />
      <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 10, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>Quick Actions</div>
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
          {['Make flashcards', 'Show code example', 'Quiz me', 'Summarize'].map(action => (
            <button
              key={action}
              onClick={() => window.dispatchEvent(new CustomEvent('tisa:quick-prompt', { detail: action }))}
              style={{
                padding: '6px 12px', borderRadius: 20,
                background: 'var(--bg3)', border: '1px solid var(--border-hover)',
                color: 'var(--text2)', fontSize: 12, cursor: 'pointer',
                fontFamily: 'var(--font-ui)', transition: 'all var(--transition)',
              }}
            >
              {action}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────
function EmptyState({ tab }: { tab: ArtifactTab }) {
  const messages = {
    workspace: { icon: <NoteIcon />, title: 'Artifact Workspace', desc: 'Responses, notes & summaries appear here as you chat' },
    code: { icon: <CodeIcon />, title: 'Code Viewer', desc: 'Generated code will appear here with syntax highlighting' },
    cards: { icon: <CardIcon />, title: 'Flashcard Deck', desc: 'Ask TISA to "create flashcards for X" to populate this' },
  };
  const m = messages[tab];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, textAlign: 'center', padding: 40 }}>
      <div style={{ width: 44, height: 44, borderRadius: 'var(--r-lg)', background: 'var(--bg3)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)' }}>
        {m.icon}
      </div>
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 500, color: 'var(--text1)', marginBottom: 6 }}>{m.title}</h3>
        <p style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 300, maxWidth: 220, lineHeight: 1.5 }}>{m.desc}</p>
      </div>
    </div>
  );
}

// ── Status dot ─────────────────────────────────────────────
function StatusDot({ color }: { color: string }) {
  const colors: Record<string, string> = { green: 'var(--green)', amber: 'var(--amber)', purple: 'var(--accent)' };
  const c = colors[color] ?? 'var(--green)';
  return <div style={{ width: 5, height: 5, borderRadius: '50%', background: c, boxShadow: `0 0 4px ${c}`, flexShrink: 0 }} />;
}

// Simple markdown parser for workspace view
function simpleMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--text0);font-weight:500">$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');
}

// Icons
const ip = { width: 18, height: 18, viewBox: '0 0 18 18', fill: 'none' as const, stroke: 'currentColor', strokeWidth: '1', strokeLinecap: 'round' as const };
const sp = { width: 13, height: 13, viewBox: '0 0 13 13', fill: 'none' as const, stroke: 'currentColor', strokeWidth: '1', strokeLinecap: 'round' as const };
function NoteIcon() { return <svg {...ip}><rect x="3" y="2" width="12" height="14" rx="1.5"/><path d="M6 6h6M6 9h6M6 12h3"/></svg>; }
function CodeIcon() { return <svg {...ip}><rect x="2" y="3" width="14" height="12" rx="1.5"/><path d="M6 7l-2 2 2 2M12 7l2 2-2 2"/></svg>; }
function CardIcon() { return <svg {...ip}><rect x="2" y="3" width="14" height="9" rx="1.5"/><rect x="4" y="5" width="14" height="9" rx="1.5" strokeDasharray="2 1.5"/></svg>; }
function CopyIcon() { return <svg {...sp}><rect x="3.5" y="3.5" width="6" height="6" rx="1"/><path d="M1 7V1.5a.5.5 0 01.5-.5H7"/></svg>; }
function DownloadIcon() { return <svg {...sp}><path d="M6.5 1v7M4 5.5L6.5 8 9 5.5"/><path d="M1.5 10h10"/></svg>; }
