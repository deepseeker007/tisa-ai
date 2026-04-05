'use client';

import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeViewProps {
  code: string;
  showToast: (msg: string) => void;
}

export function CodeView({ code, showToast }: CodeViewProps) {
  const [copied, setCopied] = useState(false);

  // Detect language from code content heuristics
  const lang = detectLang(code);
  const lines = code.split('\n').length;

  function handleCopy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    showToast('Code copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const ext = { python: 'py', javascript: 'js', typescript: 'ts', rust: 'rs', go: 'go', cpp: 'cpp' }[lang] ?? 'txt';
    const blob = new Blob([code], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `tisa-code.${ext}`;
    a.click();
    showToast(`Downloaded as tisa-code.${ext}`);
  }

  // Complexity analysis (simple heuristic)
  const hasLoop = /for|while/.test(code);
  const fnMatch = code.match(/def (\w+)|function (\w+)/);
  const fnName = fnMatch ? (fnMatch[1] ?? fnMatch[2] ?? '') : '';
  const hasRecursion = fnName.length > 0 && code.split(fnName).length > 2;
  const complexity = hasRecursion ? 'Recursive' : hasLoop ? 'Iterative' : 'Linear';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text1)' }}>Generated Code</span>
          <span style={{
            fontSize: 10, padding: '2px 7px',
            background: 'rgba(45,212,191,0.1)',
            border: '1px solid rgba(45,212,191,0.2)',
            borderRadius: 20, color: 'var(--teal)',
            fontFamily: 'var(--font-mono)',
          }}>
            {lang}
          </span>
        </div>
        <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>{lines} lines</span>
      </div>

      {/* Code block */}
      <div style={{ borderRadius: 'var(--r-lg)', overflow: 'hidden', border: '1px solid var(--border)' }}>
        {/* Code header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 14px',
          background: 'var(--bg3)',
          fontSize: 11, color: 'var(--text2)', fontFamily: 'var(--font-mono)',
        }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {['#f87171', '#f59e0b', '#34d399'].map(c => (
              <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.6 }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleDownload}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', fontSize: 11, fontFamily: 'var(--font-ui)', padding: '2px 6px', borderRadius: 4, transition: 'color var(--transition)' }}
            >
              ↓ Download
            </button>
            <button
              onClick={handleCopy}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? 'var(--green)' : 'var(--text2)', fontSize: 11, fontFamily: 'var(--font-ui)', padding: '2px 6px', borderRadius: 4 }}
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>

        <SyntaxHighlighter
          language={lang}
          style={oneDark}
          customStyle={{
            margin: 0,
            background: 'var(--bg2)',
            fontSize: 13,
            fontFamily: 'var(--font-mono)',
            lineHeight: 1.65,
            maxHeight: 400,
            borderRadius: 0,
          }}
          showLineNumbers
          lineNumberStyle={{ color: 'var(--text3)', fontSize: 11 }}
        >
          {code}
        </SyntaxHighlighter>
      </div>

      {/* Analysis panel */}
      <div style={{ padding: 14, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
        <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 10, fontWeight: 500 }}>Code Analysis</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { label: 'Lines', value: String(lines), color: 'var(--text1)' },
            { label: 'Pattern', value: complexity, color: 'var(--accent2)' },
            { label: 'Language', value: lang, color: 'var(--teal)' },
            { label: 'Quality', value: 'Clean', color: 'var(--green)' },
          ].map(stat => (
            <div key={stat.label} style={{ padding: 10, background: 'var(--bg3)', borderRadius: 'var(--r-sm)' }}>
              <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{stat.label}</div>
              <div style={{ fontSize: 14, color: stat.color, fontFamily: 'var(--font-mono)' }}>{stat.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {['Explain this code', 'Add error handling', 'Write unit tests', 'Optimize it'].map(action => (
          <button
            key={action}
            onClick={() => window.dispatchEvent(new CustomEvent('tisa:quick-prompt', { detail: action }))}
            style={{
              padding: '5px 11px', borderRadius: 20,
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
  );
}

function detectLang(code: string): string {
  if (/def |import |print\(|->/.test(code)) return 'python';
  if (/function |const |let |=>|require\(/.test(code)) return 'javascript';
  if (/interface |type |tsx|React/.test(code)) return 'typescript';
  if (/fn |let mut|println!/.test(code)) return 'rust';
  if (/func |package main|fmt\./.test(code)) return 'go';
  if (/#include|std::/.test(code)) return 'cpp';
  return 'text';
}
