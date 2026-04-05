'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar/Sidebar';
import { ChatPanel } from '@/components/Chat/ChatPanel';
import { ArtifactPanel } from '@/components/Artifact/ArtifactPanel';
import { MobileNav } from '@/components/UI/MobileNav';
import { Toast } from '@/components/UI/Toast';
import type { AppView, ArtifactTab, Message, FlashCard } from '@/lib/types';

export default function Home() {
  // ── App-level state (lifted here, passed as props) ──
  const [messages, setMessages]         = useState<Message[]>([]);
  const [view, setView]                 = useState<AppView>('chat');
  const [artifactTab, setArtifactTab]   = useState<ArtifactTab>('workspace');
  const [artifactVisible, setArtifactVisible] = useState(true);
  const [isThinking, setIsThinking]     = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [flashcards, setFlashcards]     = useState<FlashCard[]>([]);
  const [artifactCode, setArtifactCode] = useState('');
  const [artifactNotes, setArtifactNotes] = useState('');
  const [toasts, setToasts]             = useState<{ id: number; msg: string }[]>([]);

  function showToast(msg: string) {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }

  function dismissToast(id: number) {
    setToasts(prev => prev.filter(t => t.id !== id));
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg0)' }}>
      {/* Sidebar */}
      <Sidebar
        currentView={view}
        onViewChange={setView}
        messages={messages}
        showToast={showToast}
        onNewChat={() => {
          setMessages([]);
          setArtifactCode('');
          setArtifactNotes('');
          setFlashcards([]);
          showToast('New chat started');
        }}
      />

      {/* Main content area */}
      <main style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        <ChatPanel
          messages={messages}
          setMessages={setMessages}
          isThinking={isThinking}
          setIsThinking={setIsThinking}
          isGenerating={isGenerating}
          setIsGenerating={setIsGenerating}
          artifactVisible={artifactVisible}
          setArtifactVisible={setArtifactVisible}
          setArtifactTab={setArtifactTab}
          setFlashcards={setFlashcards}
          setArtifactCode={setArtifactCode}
          setArtifactNotes={setArtifactNotes}
          currentView={view}
          showToast={showToast}
        />

        {/* Artifact panel — desktop/tablet only */}
        {artifactVisible && (
          <ArtifactPanel
            tab={artifactTab}
            setTab={setArtifactTab}
            flashcards={flashcards}
            code={artifactCode}
            notes={artifactNotes}
            currentView={view}
            showToast={showToast}
          />
        )}
      </main>

      {/* Mobile bottom nav */}
      <MobileNav currentView={view} onViewChange={setView} />

      {/* Toast layer */}
      <div style={{
        position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
        zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <Toast key={t.id} message={t.msg} onDismiss={() => dismissToast(t.id)} />
        ))}
      </div>
    </div>
  );
}
