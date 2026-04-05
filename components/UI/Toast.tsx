'use client';

import { motion } from 'framer-motion';

interface ToastProps {
  message: string;
  onDismiss: () => void;
}

export function Toast({ message, onDismiss }: ToastProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2 }}
      onClick={onDismiss}
      style={{
        padding: '10px 16px',
        background: 'var(--bg3)',
        border: '1px solid var(--border-hover)',
        borderRadius: 'var(--r-md)',
        fontSize: 13,
        color: 'var(--text1)',
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        pointerEvents: 'auto',
      }}
    >
      {message}
    </motion.div>
  );
}
