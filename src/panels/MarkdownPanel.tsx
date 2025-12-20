import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Minus, BookOpen, FileText } from 'lucide-react';
import { useTheme } from '@principal-ade/industry-theme';
import {
  DocumentView,
  SlidePresentationBook,
  parseMarkdownIntoPresentation,
} from 'themed-markdown';
import 'themed-markdown/dist/index.css';
import type { PanelComponentProps, ActiveFileSlice } from '../types';

/**
 * Get the basename of a file path
 */
const basename = (path: string): string => {
  const parts = path.split('/');
  return parts[parts.length - 1] || path;
};

/**
 * MarkdownPanel - A panel for rendering markdown documents with industry theming
 *
 * This panel integrates with the panel framework to:
 * - Listen to file:opened events
 * - Read content from the active-file context slice
 * - Display markdown with themed rendering using DocumentView
 * - Support view mode switching between document and slides
 * - Provide font size controls and slide navigation
 */
export const MarkdownPanel: React.FC<PanelComponentProps> = ({
  context,
  actions: _actions,
  events,
}) => {
  const { theme } = useTheme();
  const [viewMode, setViewMode] = useState<'document' | 'book'>('book');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [fontSizeScale, setFontSizeScale] = useState<number>(1.0);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Listen for file:opened events
  useEffect(() => {
    const unsubscribe = events.on('file:opened', (event) => {
      console.log('Markdown Panel: File opened:', event.payload);
      // Reset to default view mode when new file is opened
      setViewMode('book');
      setCurrentSlide(0);
    });
    return unsubscribe;
  }, [events]);

  // Get the active file from context slice
  const activeFile = context.getSlice<ActiveFileSlice>('active-file');

  // Check if the active file is a markdown file
  const isMarkdown =
    activeFile?.data?.type === 'markdown' ||
    activeFile?.data?.path?.match(/\.(md|mdx|markdown)$/i);

  // Get markdown content
  const markdownContent = activeFile?.data?.content || '';

  // Parse markdown into slides using themed-markdown utility
  const presentation = useMemo(
    () => parseMarkdownIntoPresentation(markdownContent),
    [markdownContent]
  );
  const slides = presentation.slides.map((slide) => slide.location.content);
  const hasSlides = slides.length > 1;

  const handleFontSizeIncrease = () => {
    setFontSizeScale((prev) => Math.min(prev + 0.1, 3.0));
  };

  const handleFontSizeDecrease = () => {
    setFontSizeScale((prev) => Math.max(prev - 0.1, 0.5));
  };

  // Show loading state while content is being fetched
  if (activeFile?.loading) {
    return (
      <div
        style={{
          display: 'flex',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.background,
          fontFamily: theme.fonts.body,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: theme.colors.textSecondary }}>
            Loading {activeFile.data?.path || 'file'}...
          </p>
        </div>
      </div>
    );
  }

  // Show error state if fetch failed
  if (activeFile?.error) {
    return (
      <div
        style={{
          display: 'flex',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.background,
          fontFamily: theme.fonts.body,
        }}
      >
        <div style={{ textAlign: 'center', color: theme.colors.error }}>
          <p>Error loading markdown file</p>
          <p style={{ fontSize: '14px', marginTop: '8px' }}>
            {activeFile.error.message}
          </p>
        </div>
      </div>
    );
  }

  // Show placeholder if no file is selected or if it's not a markdown file
  if (!activeFile?.data || !isMarkdown) {
    return (
      <div
        style={{
          display: 'flex',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.background,
          fontFamily: theme.fonts.body,
        }}
      >
        <p style={{ color: theme.colors.textSecondary }}>
          Select a markdown file to preview
        </p>
      </div>
    );
  }

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
          height: '40px',
          minHeight: '40px',
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
          <span
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: theme.colors.text,
              fontFamily: theme.fonts.body,
            }}
          >
            {basename(activeFile.data.path)}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Font size controls - hidden on mobile */}
          {!isMobile && (
            <>
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
            </>
          )}

          {/* View mode toggle - only show if document has slides */}
          {hasSlides && (
            <div
              style={{
                display: 'flex',
                backgroundColor: theme.colors.background,
                borderRadius: '4px',
                border: `1px solid ${theme.colors.border}`,
                overflow: 'hidden',
                marginLeft: isMobile ? '0' : '8px',
              }}
            >
              <button
                onClick={() => {
                  setViewMode('book');
                  setCurrentSlide(0);
                }}
                title="Sections"
                style={{
                  background:
                    viewMode === 'book' ? theme.colors.primary : 'transparent',
                  color:
                    viewMode === 'book'
                      ? theme.colors.background
                      : theme.colors.textSecondary,
                  border: 'none',
                  padding: isMobile ? '6px 8px' : '6px 12px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 500,
                  fontFamily: theme.fonts.body,
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {isMobile ? <BookOpen size={16} /> : 'Sections'}
              </button>
              <button
                onClick={() => {
                  setViewMode('document');
                  setCurrentSlide(0);
                }}
                title="Document"
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
                  padding: isMobile ? '6px 8px' : '6px 12px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 500,
                  fontFamily: theme.fonts.body,
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {isMobile ? <FileText size={16} /> : 'Document'}
              </button>
            </div>
          )}
        </div>
      </div>

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
            maxWidth="100%"
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
            tocDisplayMode="sidebar"
            tocSidebarPosition="left"
            initialTocOpen={false}
          />
        )}
      </div>
    </div>
  );
};
