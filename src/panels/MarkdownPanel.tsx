import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Minus, BookOpen, FileText } from 'lucide-react';
import { useTheme } from '@principal-ade/industry-theme';
import {
  DocumentView,
  SlidePresentationBook,
  parseMarkdownIntoPresentation,
} from 'themed-markdown';
import type { RepositoryInfo } from '@principal-ade/markdown-utils';
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
 * Get the directory path (everything except the filename)
 */
const getBasePath = (filePath: string): string => {
  const parts = filePath.split('/');
  parts.pop(); // Remove filename
  return parts.join('/');
};

export interface MarkdownPanelProps extends PanelComponentProps {
  /**
   * Optional file path to display.
   * If provided, this takes precedence over the active-file context slice.
   * This allows the host to control panel state via props instead of context.
   */
  filePath?: string | null;
  /**
   * Optional width to pass to DocumentView for layout calculations.
   * Useful when embedding in panels that need responsive width handling.
   */
  width?: number;
}

/**
 * MarkdownPanel - A panel for rendering markdown documents with industry theming
 *
 * This panel integrates with the panel framework to:
 * - Listen to file:opened events
 * - Read content from the active-file context slice (or from filePath prop)
 * - Display markdown with themed rendering using DocumentView
 * - Support view mode switching between document and slides
 * - Provide font size controls and slide navigation
 */
export const MarkdownPanel: React.FC<MarkdownPanelProps> = ({
  context,
  actions,
  events,
  filePath: filePathProp,
  width,
}) => {
  const { theme } = useTheme();
  const [viewMode, setViewMode] = useState<'document' | 'book'>('document');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [fontSizeScale, setFontSizeScale] = useState<number>(1.0);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  // When controlled by filePath prop, load the file content
  useEffect(() => {
    if (filePathProp) {
      console.log('[MarkdownPanel] Loading file from prop:', filePathProp);
      // Check if setActiveFile action exists (it's a custom action added by RepositoryPanelContext)
      const setActiveFile = (actions as any)?.setActiveFile;
      if (typeof setActiveFile === 'function') {
        setActiveFile(filePathProp);
      }
    }
  }, [filePathProp, actions]);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Listen for preference events
  useEffect(() => {
    const unsubscribe = events.on('markdown-panel:set-preferences', (event) => {
      const payload = event.payload as {
        viewMode?: 'document' | 'book';
        fontSizeScale?: number;
      };
      if (payload.viewMode) {
        setViewMode(payload.viewMode);
      }
      if (payload.fontSizeScale !== undefined) {
        setFontSizeScale(payload.fontSizeScale);
      }
      setPreferencesLoaded(true);
    });
    return unsubscribe;
  }, [events]);

  // Request preferences on mount
  useEffect(() => {
    events.emit({
      type: 'markdown-panel:request-preferences',
      source: 'markdown-panel',
      timestamp: Date.now(),
      payload: {},
    });
  }, [events]);

  // Listen for file:opened events
  useEffect(() => {
    const unsubscribe = events.on('file:opened', (event) => {
      console.log('Markdown Panel: File opened:', event.payload);
      // Reset slide position when new file is opened (but keep view mode preference)
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

  // Extract repository info from the file source for image URL transformation
  const repositoryInfo: RepositoryInfo | undefined = useMemo(() => {
    const source = activeFile?.data?.source;
    if (!source) return undefined;

    // Determine the branch - use location for branch type, or metadata.currentBranch for local
    const branch =
      source.locationType === 'branch'
        ? source.location
        : source.metadata?.currentBranch || 'main';

    return {
      owner: source.owner,
      repo: source.name,
      branch,
      basePath: getBasePath(activeFile?.data?.path || ''),
    };
  }, [activeFile?.data?.source, activeFile?.data?.path]);

  const handleFontSizeIncrease = () => {
    setFontSizeScale((prev) => {
      const newScale = Math.min(prev + 0.1, 3.0);
      events.emit({
        type: 'markdown-panel:font-scale-change',
        source: 'markdown-panel',
        timestamp: Date.now(),
        payload: { fontSizeScale: newScale },
      });
      return newScale;
    });
  };

  const handleFontSizeDecrease = () => {
    setFontSizeScale((prev) => {
      const newScale = Math.max(prev - 0.1, 0.5);
      events.emit({
        type: 'markdown-panel:font-scale-change',
        source: 'markdown-panel',
        timestamp: Date.now(),
        payload: { fontSizeScale: newScale },
      });
      return newScale;
    });
  };

  const handleViewModeChange = (mode: 'document' | 'book') => {
    setViewMode(mode);
    setCurrentSlide(0);
    events.emit({
      type: 'markdown-panel:view-mode-change',
      source: 'markdown-panel',
      timestamp: Date.now(),
      payload: { viewMode: mode },
    });
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
                onClick={() => handleViewModeChange('document')}
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
              <button
                onClick={() => handleViewModeChange('book')}
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
            content={markdownContent}
            theme={theme}
            fontSizeScale={fontSizeScale}
            onCheckboxChange={() => {}}
            slideIdPrefix="markdown-panel"
            maxWidth="100%"
            repositoryInfo={repositoryInfo}
            width={width}
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
            repositoryInfo={repositoryInfo}
            width={width}
          />
        )}
      </div>
    </div>
  );
};
