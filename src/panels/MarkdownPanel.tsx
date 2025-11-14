import React, { useState, useMemo } from 'react';
import { FileText, Plus, Minus } from 'lucide-react';
import { useTheme } from '@a24z/industry-theme';
import {
  DocumentView,
  SlidePresentationBook,
  parseMarkdownIntoPresentation,
} from 'themed-markdown';
import 'themed-markdown/dist/index.css';
import type { PanelComponentProps } from '../types';

/**
 * MarkdownPanel - A panel for rendering markdown documents with industry theming
 *
 * This panel demonstrates:
 * - Themed markdown rendering using DocumentView from themed-markdown
 * - View mode switching between document and slides
 * - Font size controls
 * - Slide navigation
 * - Integration with the panel framework
 */
export const MarkdownPanel: React.FC<PanelComponentProps> = ({
  context,
  actions: _actions,
}) => {
  const { theme } = useTheme();
  const [viewMode, setViewMode] = useState<'document' | 'book'>('document');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [fontSizeScale, setFontSizeScale] = useState<number>(1.0);

  // Sample markdown content - in a real implementation, this would come from context
  const sampleMarkdown = `# Welcome to Industry-Themed Markdown

This panel demonstrates the **themed-markdown** component with industry theming.

## Features

- Beautiful markdown rendering
- Syntax highlighting for code blocks
- Industry-themed styling
- Multiple view modes (document and slides)

## Code Example

\`\`\`typescript
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

console.log(greet('World'));
\`\`\`

## Lists and More

1. First item
2. Second item
3. Third item

- Bullet point
- Another bullet
- And another

---

## Slide 2: More Content

This is the second slide, demonstrating the slide-based presentation mode.

> Blockquotes are supported too!

### Tables

| Feature | Status |
|---------|--------|
| Markdown | ✅ |
| Theming | ✅ |
| Slides | ✅ |

---

## Slide 3: Final Slide

Thank you for exploring the themed markdown panel!

\`\`\`json
{
  "framework": "themed-markdown",
  "theme": "industry",
  "awesome": true
}
\`\`\`
`;

  // Parse markdown into slides using themed-markdown utility
  const presentation = useMemo(
    () => parseMarkdownIntoPresentation(sampleMarkdown),
    [sampleMarkdown]
  );
  const slides = presentation.slides.map((slide) => slide.location.content);
  const hasSlides = slides.length > 1;

  const handleFontSizeIncrease = () => {
    setFontSizeScale((prev) => Math.min(prev + 0.1, 3.0));
  };

  const handleFontSizeDecrease = () => {
    setFontSizeScale((prev) => Math.max(prev - 0.1, 0.5));
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: theme.colors.background,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          height: '48px',
          minHeight: '48px',
          borderBottom: `1px solid ${theme.colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: '16px',
          paddingRight: '16px',
          backgroundColor: theme.colors.backgroundLight,
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={20} color={theme.colors.primary} />
          <span
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: theme.colors.text,
              fontFamily: theme.fonts.body,
            }}
          >
            Markdown Viewer
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Font size controls */}
          <button
            onClick={handleFontSizeDecrease}
            title="Decrease Font Size"
            style={{
              background: 'none',
              border: `1px solid ${theme.colors.border}`,
              padding: '6px 8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: theme.colors.textSecondary,
              borderRadius: '4px',
              transition: 'all 0.2s',
            }}
          >
            <Minus size={14} />
          </button>

          <span
            style={{
              fontSize: '12px',
              color: theme.colors.textSecondary,
              userSelect: 'none',
              minWidth: '45px',
              textAlign: 'center',
              fontFamily: theme.fonts.body,
            }}
          >
            {Math.round(fontSizeScale * 100)}%
          </span>

          <button
            onClick={handleFontSizeIncrease}
            title="Increase Font Size"
            style={{
              background: 'none',
              border: `1px solid ${theme.colors.border}`,
              padding: '6px 8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: theme.colors.textSecondary,
              borderRadius: '4px',
              transition: 'all 0.2s',
            }}
          >
            <Plus size={14} />
          </button>

          {/* View mode toggle - only show if document has slides */}
          {hasSlides && (
            <div
              style={{
                display: 'flex',
                backgroundColor: theme.colors.background,
                borderRadius: '4px',
                border: `1px solid ${theme.colors.border}`,
                overflow: 'hidden',
                marginLeft: '8px',
              }}
            >
              <button
                onClick={() => {
                  setViewMode('document');
                  setCurrentSlide(0);
                }}
                style={{
                  background:
                    viewMode === 'document'
                      ? theme.colors.primary
                      : 'transparent',
                  color:
                    viewMode === 'document'
                      ? theme.colors.background
                      : theme.colors.textSecondary,
                  border: 'none',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 500,
                  fontFamily: theme.fonts.body,
                  transition: 'all 0.2s',
                }}
              >
                Document
              </button>
              <button
                onClick={() => {
                  setViewMode('book');
                  setCurrentSlide(0);
                }}
                style={{
                  background:
                    viewMode === 'book' ? theme.colors.primary : 'transparent',
                  color:
                    viewMode === 'book'
                      ? theme.colors.background
                      : theme.colors.textSecondary,
                  border: 'none',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 500,
                  fontFamily: theme.fonts.body,
                  transition: 'all 0.2s',
                }}
              >
                Slides
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Repository info banner */}
      {context.repositoryPath && (
        <div
          style={{
            padding: '8px 16px',
            backgroundColor: theme.colors.backgroundSecondary,
            borderBottom: `1px solid ${theme.colors.border}`,
            fontSize: '12px',
            color: theme.colors.textSecondary,
            fontFamily: theme.fonts.body,
          }}
        >
          Repository: <code>{context.repositoryPath}</code>
        </div>
      )}

      {/* Content */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          width: '100%',
          height: '100%',
        }}
      >
        {viewMode === 'document' ? (
          <DocumentView
            content={slides}
            theme={theme}
            fontSizeScale={fontSizeScale}
            onCheckboxChange={() => {}}
            slideIdPrefix="markdown-panel"
            showSectionHeaders={true}
            showSeparators={true}
          />
        ) : (
          <SlidePresentationBook
            slides={slides}
            initialSlide={currentSlide}
            theme={theme}
            fontSizeScale={fontSizeScale}
            onSlideChange={setCurrentSlide}
            onCheckboxChange={() => {}}
            showNavigation={true}
            showSlideCounter={true}
            showFullscreenButton={true}
            viewMode="single"
            slideIdPrefix="markdown-panel-book"
            enableHtmlPopout={true}
            enableKeyboardScrolling={true}
          />
        )}
      </div>
    </div>
  );
};
