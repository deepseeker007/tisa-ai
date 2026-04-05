'use client';

import { motion } from 'framer-motion';
import type { AppView, Message } from '@/lib/types';

interface SidebarProps {
  currentView: AppView;
  onViewChange: (v: AppView) => void;
  messages: Message[];
  showToast: (msg: string) => void;
  onNewChat: () => void;
}

export function Sidebar({ currentView, onViewChange, messages, showToast, onNewChat }: SidebarProps) {
  // Build history items from messages (user messages only)
  const history = messages
    .filter(m => m.role === 'user')
    .slice(-8)
    .reverse()
    .map(m => m.content.slice(0, 48) + (m.content.length > 48 ? '...' : ''));

  return (
    <aside style={{
      width: 'var(--sidebar-w)',
      minWidth: 'var(--sidebar-w)',
      background: 'var(--bg1)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      zIndex: 10,
    }}>
      {/* Logo */}
      <div style={{
        padding: '20px 18px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <div style={{
          width: 30, height: 30,
          background: 'linear-gradient(135deg, var(--accent), var(--teal))',
          borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <TISALogoMark />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text0)' }}>TISA</div>
          <div style={{ fontSize: 9, fontWeight: 500, color: 'var(--accent2)', letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.8 }}>AI Companion</div>
        </div>
      </div>

      {/* New Chat */}
      <button onClick={onNewChat} style={{
        margin: '14px 12px 0',
        padding: '9px 14px',
        background: 'var(--bg3)',
        border: '1px solid var(--border-hover)',
        borderRadius: 'var(--r-md)',
        color: 'var(--text1)',
        fontFamily: 'var(--font-ui)',
        fontSize: 13,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        transition: 'all var(--transition)',
        width: 'calc(100% - 24px)',
        textAlign: 'left',
      }}>
        <PlusIcon />
        New Chat
      </button>

      {/* Nav */}
      <nav style={{ padding: '18px 10px 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <SectionLabel>Main</SectionLabel>
        <NavItem icon={<ChatIcon />} label="Chat"      active={currentView === 'chat'}     onClick={() => onViewChange('chat')} />
        <NavItem icon={<VaultIcon />} label="Doc Vault" active={currentView === 'vault'}    onClick={() => onViewChange('vault')} />
        <NavItem icon={<TimerIcon />} label="Focus"     active={currentView === 'timer'}    onClick={() => onViewChange('timer')} />

        {history.length > 0 && (
          <>
            <SectionLabel>History</SectionLabel>
            {history.map((text, i) => (
              <div key={i} style={{
                padding: '7px 10px',
                borderRadius: 'var(--r-sm)',
                fontSize: 12,
                color: 'var(--text2)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                transition: 'all var(--transition)',
              }}
              onMouseEnter={e => { (e.target as HTMLElement).style.color = 'var(--text1)'; (e.target as HTMLElement).style.background = 'var(--bg3)'; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.color = 'var(--text2)'; (e.target as HTMLElement).style.background = 'transparent'; }}
              >
                {text}
              </div>
            ))}
          </>
        )}
      </nav>

      <div style={{ flex: 1 }} />

      {/* Bottom nav */}
      <div style={{ padding: '14px 10px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <NavItem icon={<SettingsIcon />} label="Settings" active={currentView === 'settings'} onClick={() => onViewChange('settings')} />
        <NavItem icon={<ProfileIcon />}  label="Profile"  active={currentView === 'profile'}  onClick={() => onViewChange('profile')} />
      </div>
    </aside>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text3)', padding: '12px 10px 6px' }}>
      {children}
    </div>
  );
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

function NavItem({ icon, label, active, onClick }: NavItemProps) {
  return (
    <motion.div
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 10px',
        borderRadius: 'var(--r-sm)',
        color: active ? 'var(--accent2)' : 'var(--text2)',
        background: active ? 'var(--accent-glow)' : 'transparent',
        border: active ? '1px solid rgba(124,106,247,0.2)' : '1px solid transparent',
        cursor: 'pointer',
        fontSize: 13,
        transition: 'all var(--transition)',
      }}
    >
      {icon}
      <span>{label}</span>
    </motion.div>
  );
}

// ── Inline SVG icon set — ultra-thin, uniform 1px stroke ──
const iconProps = { width: 15, height: 15, viewBox: '0 0 15 15', fill: 'none' as const, stroke: 'currentColor', strokeWidth: '1', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

function TISALogoMark() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2L13 5.5V10.5L8 14L3 10.5V5.5L8 2Z" stroke="white" strokeWidth="1"/><circle cx="8" cy="8" r="2" fill="white"/></svg>;
}
function PlusIcon() { return <svg {...iconProps}><path d="M7.5 1v13M1 7.5h13"/></svg>; }
function ChatIcon() { return <svg {...iconProps}><path d="M1.5 2a.5.5 0 01.5-.5h11a.5.5 0 01.5.5v8a.5.5 0 01-.5.5H9l-3 2.5V10.5H2a.5.5 0 01-.5-.5V2z"/></svg>; }
function VaultIcon() { return <svg {...iconProps}><rect x="2" y="1.5" width="11" height="12" rx="1.5"/><path d="M5 5h5M5 7.5h5M5 10h3"/></svg>; }
function TimerIcon() { return <svg {...iconProps}><circle cx="7.5" cy="8.5" r="5.5"/><path d="M7.5 5.5V8.5l2 1.5"/><path d="M5.5 1.5h4"/></svg>; }
function SettingsIcon() { return <svg {...iconProps}><circle cx="7.5" cy="7.5" r="2"/><path d="M7.5 1v1.5m0 9V13m4.243-9.243l-1.06 1.06M4.318 10.68l-1.06 1.061M13 7.5h-1.5m-9 0H1m9.243 4.243l-1.06-1.06M4.318 4.318l-1.06-1.06"/></svg>; }
function ProfileIcon() { return <svg {...iconProps}><circle cx="7.5" cy="5" r="3"/><path d="M1.5 13.5c0-3.314 2.686-6 6-6s6 2.686 6 6"/></svg>; }
