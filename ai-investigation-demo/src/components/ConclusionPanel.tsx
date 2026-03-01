import { CheckCircle2, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface ConclusionPanelProps {
  conclusion: string;
}

function parseMarkdown(text: string): string {
  const lines = text.split('\n');
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code blocks: ```lang ... ```
    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(escapeHtml(lines[i]));
        i++;
      }
      i++; // skip closing ```
      result.push(
        `<div class="conclusion-code-block my-3">` +
        (lang ? `<div class="conclusion-code-lang">${lang}</div>` : '') +
        `<pre class="conclusion-code-pre">${codeLines.join('\n')}</pre>` +
        `</div>`
      );
      continue;
    }

    // Tables: lines starting with |
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      result.push(renderTable(tableLines));
      continue;
    }

    // Headings
    if (line.startsWith('## ')) {
      result.push(`<h2 class="conclusion-h2">${inlineFormat(line.slice(3))}</h2>`);
      i++;
      continue;
    }
    if (line.startsWith('### ')) {
      result.push(`<h3 class="conclusion-h3">${inlineFormat(line.slice(4))}</h3>`);
      i++;
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (olMatch) {
      result.push(`<li class="conclusion-li-ol">${inlineFormat(olMatch[2])}</li>`);
      i++;
      continue;
    }

    // Unordered list
    if (line.startsWith('- ')) {
      result.push(`<li class="conclusion-li-ul">${inlineFormat(line.slice(2))}</li>`);
      i++;
      continue;
    }

    // Empty line → spacer
    if (line.trim() === '') {
      result.push('<div class="h-2"></div>');
      i++;
      continue;
    }

    // Regular paragraph
    result.push(`<p class="conclusion-p">${inlineFormat(line)}</p>`);
    i++;
  }

  return result.join('\n');
}

function inlineFormat(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-[var(--color-text-primary)] font-semibold">$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="conclusion-inline-code">$1</code>');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderTable(lines: string[]): string {
  const rows = lines
    .filter(l => !l.trim().match(/^\|[\s\-:|]+\|$/)) // filter out separator rows
    .map(l =>
      l.trim().slice(1, -1).split('|').map(cell => cell.trim())
    );

  if (rows.length === 0) return '';

  const header = rows[0];
  const body = rows.slice(1);

  let html = '<div class="conclusion-table-wrap my-3"><table class="conclusion-table">';
  html += '<thead><tr>';
  for (const cell of header) {
    html += `<th>${inlineFormat(cell)}</th>`;
  }
  html += '</tr></thead>';

  if (body.length > 0) {
    html += '<tbody>';
    for (const row of body) {
      html += '<tr>';
      for (const cell of row) {
        html += `<td>${inlineFormat(cell)}</td>`;
      }
      html += '</tr>';
    }
    html += '</tbody>';
  }

  html += '</table></div>';
  return html;
}

export function ConclusionPanel({ conclusion }: ConclusionPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(conclusion);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-slide-up">
      <div className="glass-card rounded-xl overflow-hidden ring-1 ring-[var(--color-accent-green)]/20 shadow-lg shadow-[var(--color-accent-green)]/5">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-border)]/50 bg-[var(--color-accent-green)]/5">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-[var(--color-accent-green)]" />
            <span className="text-sm font-semibold text-[var(--color-accent-green)]">
              Investigation Complete
            </span>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs text-[var(--color-text-muted)] 
              hover:text-[var(--color-text-secondary)] hover:bg-white/5 transition-colors"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        
        <div
          className="conclusion-content px-5 py-4"
          dangerouslySetInnerHTML={{ __html: parseMarkdown(conclusion) }}
        />
      </div>
    </div>
  );
}
