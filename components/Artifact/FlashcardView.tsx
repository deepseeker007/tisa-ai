'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIndexedDB } from '@/hooks/useIndexedDB';
import type { FlashCard } from '@/lib/types';

interface FlashcardViewProps {
  cards: FlashCard[];
  showToast: (msg: string) => void;
}

export function FlashcardView({ cards, showToast }: FlashcardViewProps) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [ratings, setRatings] = useState<Record<string, string>>({});
  const db = useIndexedDB();

  const card = cards[idx];
  const total = cards.length;
  const progress = ((idx + 1) / total) * 100;

  async function handleRate(rating: 'hard' | 'okay' | 'easy') {
    setRatings(prev => ({ ...prev, [card.id]: rating }));
    await db.updateFlashcardRating(card.id, rating);
    const days = { hard: 1, okay: 3, easy: 7 }[rating];
    showToast(`Marked as ${rating} · Review in ${days} day${days > 1 ? 's' : ''}`);
    if (idx < total - 1) {
      setFlipped(false);
      setTimeout(() => setIdx(i => i + 1), 200);
    } else {
      showToast('All cards reviewed! Great session.');
    }
  }

  function goNext() {
    if (idx < total - 1) { setFlipped(false); setTimeout(() => setIdx(i => i + 1), 150); }
  }
  function goPrev() {
    if (idx > 0) { setFlipped(false); setTimeout(() => setIdx(i => i - 1), 150); }
  }

  const ratingColor: Record<string, string> = {
    hard: 'rgba(248,113,113,0.15)',
    okay: 'rgba(245,158,11,0.12)',
    easy: 'rgba(52,211,153,0.1)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text1)' }}>Flashcards</span>
        <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>{idx + 1} / {total}</span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 2, background: 'var(--bg3)', borderRadius: 1, overflow: 'hidden' }}>
        <motion.div
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
          style={{ height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--teal))', borderRadius: 1 }}
        />
      </div>

      {/* Card */}
      <motion.div
        onClick={() => setFlipped(f => !f)}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        animate={{ background: ratings[card.id] ? ratingColor[ratings[card.id]] : 'var(--bg2)' }}
        style={{
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-xl)',
          padding: '32px 28px',
          textAlign: 'center',
          cursor: 'pointer',
          minHeight: 200,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          position: 'relative',
          userSelect: 'none',
        }}
      >
        <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text3)' }}>
          {flipped ? 'Answer' : 'Question'}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={flipped ? 'answer' : 'question'}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            style={{ fontSize: 16, fontWeight: 400, color: 'var(--text0)', lineHeight: 1.55 }}
          >
            {flipped ? card.answer : card.question}
          </motion.div>
        </AnimatePresence>

        {!flipped && (
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>Tap to reveal answer</div>
        )}

        {/* Flip indicator */}
        <div style={{ position: 'absolute', top: 14, right: 16, color: 'var(--text3)' }}>
          <FlipIcon />
        </div>
      </motion.div>

      {/* Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <button
          onClick={goPrev}
          disabled={idx === 0}
          style={{
            padding: '7px 16px', borderRadius: 'var(--r-md)',
            background: 'var(--bg3)', border: '1px solid var(--border-hover)',
            color: idx === 0 ? 'var(--text3)' : 'var(--text1)',
            fontSize: 13, cursor: idx === 0 ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-ui)', opacity: idx === 0 ? 0.4 : 1,
          }}
        >
          ← Prev
        </button>
        <span style={{ fontSize: 12, color: 'var(--text2)', fontFamily: 'var(--font-mono)' }}>
          {idx + 1}/{total}
        </span>
        <button
          onClick={goNext}
          disabled={idx === total - 1}
          style={{
            padding: '7px 16px', borderRadius: 'var(--r-md)',
            background: 'var(--bg3)', border: '1px solid var(--border-hover)',
            color: idx === total - 1 ? 'var(--text3)' : 'var(--text1)',
            fontSize: 13, cursor: idx === total - 1 ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-ui)', opacity: idx === total - 1 ? 0.4 : 1,
          }}
        >
          Next →
        </button>
      </div>

      {/* Rating buttons */}
      {flipped && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: 14, background: 'var(--bg2)',
            border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
          }}
        >
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 10, fontWeight: 500 }}>Rate your answer</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['hard', 'okay', 'easy'] as const).map(r => (
              <button
                key={r}
                onClick={() => handleRate(r)}
                style={{
                  flex: 1, padding: '8px',
                  borderRadius: 'var(--r-sm)',
                  background: { hard: 'rgba(248,113,113,0.1)', okay: 'rgba(245,158,11,0.1)', easy: 'rgba(52,211,153,0.1)' }[r],
                  border: `1px solid ${{ hard: 'rgba(248,113,113,0.25)', okay: 'rgba(245,158,11,0.25)', easy: 'rgba(52,211,153,0.25)' }[r]}`,
                  color: { hard: 'var(--red)', okay: 'var(--amber)', easy: 'var(--green)' }[r],
                  fontSize: 12, cursor: 'pointer',
                  fontFamily: 'var(--font-ui)',
                  textTransform: 'capitalize',
                  transition: 'all var(--transition)',
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Session stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {[
          { label: 'Hard', count: Object.values(ratings).filter(r => r === 'hard').length, color: 'var(--red)' },
          { label: 'Okay', count: Object.values(ratings).filter(r => r === 'okay').length, color: 'var(--amber)' },
          { label: 'Easy', count: Object.values(ratings).filter(r => r === 'easy').length, color: 'var(--green)' },
        ].map(stat => (
          <div key={stat.label} style={{
            padding: '10px', background: 'var(--bg3)',
            borderRadius: 'var(--r-sm)', textAlign: 'center',
          }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{stat.label}</div>
            <div style={{ fontSize: 18, fontWeight: 500, color: stat.color, fontFamily: 'var(--font-mono)' }}>{stat.count}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FlipIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
      <path d="M2 5a5 5 0 019 3M12 5l-1-2.5L9 5M12 9a5 5 0 01-9-3M2 9l1 2.5L5 9"/>
    </svg>
  );
}
