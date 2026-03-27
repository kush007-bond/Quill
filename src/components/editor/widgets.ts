/**
 * widgets.ts
 * CodeMirror WidgetType implementations for inline-rendered images and tables.
 * These are swapped in by buildDecorations() when the cursor is off the line/block.
 */

import { WidgetType } from '@codemirror/view';

// ── Image widget ──────────────────────────────────────────────────────────────

export class ImageWidget extends WidgetType {
  constructor(readonly src: string, readonly alt: string) { super(); }

  toDOM() {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:block; margin:12px 0; line-height:0;';

    const img = document.createElement('img');
    img.src    = this.src;
    img.alt    = this.alt;
    img.title  = this.alt || 'image';
    img.style.cssText =
      'max-width:100%; max-height:420px; border-radius:6px; display:block; cursor:pointer;';

    img.onerror = () => {
      const placeholder = document.createElement('span');
      placeholder.textContent = `⚠ Image not found: ${this.alt || this.src}`;
      placeholder.style.cssText =
        'font-size:0.8em; color:var(--text-muted); font-family:var(--font-sans); font-style:italic;';
      wrap.replaceChild(placeholder, img);
    };

    wrap.appendChild(img);
    return wrap;
  }

  eq(other: ImageWidget) {
    return other.src === this.src && other.alt === this.alt;
  }

  ignoreEvent() { return false; }
}

