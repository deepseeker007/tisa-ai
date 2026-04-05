'use client';

import type { AppView } from '@/lib/types';

interface MobileNavProps {
  currentView: AppView;
  onViewChange: (v: AppView) => void;
}

export function MobileNav({ currentView, onViewChange }: MobileNavProps) {
  const items: { view: AppView; icon: React.ReactNode; label: string }[] = [
    { view: 'chat',    icon: <ChatIcon />,    label: 'Chat' },
    { view: 'vault',   icon: <VaultIcon />,   label: 'Vault' },
    { view: 'timer',   icon: <TimerIcon />,   label: 'Focus' },
    { view: 'profile', icon: <ProfileIcon />, label: 'Profile' },
  ];

  return (
    <nav style={{
      display: 'none', // shown via @media in globals.css
      position: 'fixed',
      bottom: 0, left: 0, right: 0,
      height: 60,
      background: 'var(--bg1)',
      borderTop: '1px solid var(--border)',
      zIndex: 100,
      alignItems: 'center',
      justifyContent: 'space-around',
      padding: '0 10px',
    }}
    className="mobile-nav"
    >
      {items.map(item => (
        <button
          key={item.view}
          onClick={() => onViewChange(item.view)}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            padding: '8px 12px',
            background: 'none', border: 'none',
            color: currentView === item.view ? 'var(--accent2)' : 'var(--text3)',
            cursor: 'pointer', transition: 'color var(--transition)',
            fontFamily: 'var(--font-ui)',
          }}
        >
          {item.icon}
          <span style={{ fontSize: 10 }}>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

const ip = { width: 18, height: 18, viewBox: '0 0 18 18', fill: 'none' as const, stroke: 'currentColor', strokeWidth: '1.1', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
function ChatIcon() { return <svg {...ip}><path d="M2 3a1 1 0 011-1h12a1 1 0 011 1v9a1 1 0 01-1 1h-4.5L7 15v-2H3a1 1 0 01-1-1V3z"/></svg>; }
function VaultIcon() { return <svg {...ip}><rect x="3" y="2" width="12" height="14" rx="1.5"/><path d="M6 6h6M6 9h6M6 12h4"/></svg>; }
function TimerIcon() { return <svg {...ip}><circle cx="9" cy="10" r="6.5"/><path d="M9 6.5V10l2.5 2"/><path d="M6.5 2h5"/></svg>; }
function ProfileIcon() { return <svg {...ip}><circle cx="9" cy="6.5" r="3.5"/><path d="M2 16.5c0-3.866 3.134-7 7-7s7 3.134 7 7"/></svg>; }
