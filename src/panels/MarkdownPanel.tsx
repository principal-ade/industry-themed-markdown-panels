import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Minus } from 'lucide-react';
import { useTheme } from '@principal-ade/industry-theme';
import { DocumentView } from 'themed-markdown';
import type { RepositoryInfo } from '@principal-ade/markdown-utils';
import 'themed-markdown/dist/index.css';
import type {
  PanelComponentProps,
  ActiveFileSlice,
  MarkdownPanelActions,
  MarkdownPanelContext,
} from '../types';

/**
 * Get the directory path (everything except the filename)
 */
const getBasePath = (filePath: string): string => {
  const parts = filePath.split('/');
  parts.pop(); // Remove filename
  return parts.join('/');
};

/**
 * Information about a content change event
 */
export interface ContentChangeInfo {
  /** The file path that changed */
  path: string;
  /** Previous content before the change */
  previousContent: string;
  /** New content after the change */
  newContent: string;
  /** Character count difference (positive = added, negative = removed) */
  charDiff: number;
  /** Timestamp of when the change was detected */
  timestamp: number;
}

export interface MarkdownPanelProps
  extends PanelComponentProps<MarkdownPanelActions, MarkdownPanelContext> {
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
  /**
   * Optional callback when file content changes externally.
   * Called with info about the change including previous/new content.
   * Useful for implementing diff visualization or change animations.
   */
  onContentChange?: (change: ContentChangeInfo) => void;
}

/**
 * MarkdownPanel - A panel for rendering markdown documents with industry theming
 *
 * This panel integrates with the panel framework to:
 * - Read content from the active-file context slice (or from filePath prop)
 * - Display markdown with themed rendering using DocumentView
 * - Provide floating font size controls
 */
export const MarkdownPanel: React.FC<MarkdownPanelProps> = ({
  context,
  actions,
  events,
  filePath: filePathProp,
  width,
  onContentChange,
}) => {
  const { theme } = useTheme();
  const [fontSizeScale, setFontSizeScale] = useState<number>(1.0);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Track previous content for change detection
  const previousContentRef = useRef<{ path: string; content: string } | null>(null);

  // Local state for prop-based content loading (used when filePath prop is provided)
  const [propBasedContent, setPropBasedContent] = useState<{
    path: string;
    content: string;
    loading: boolean;
    error: Error | null;
  } | null>(null);

  // When filePath prop is provided, load content directly (for tabbed usage)
  // This avoids sharing state via the active-file slice
  useEffect(() => {
    if (!filePathProp) {
      setPropBasedContent(null);
      return;
    }

    // Check if we already have this file loaded
    if (propBasedContent?.path === filePathProp && !propBasedContent.loading) {
      return;
    }

    const loadContent = async () => {
      console.log('[MarkdownPanel] Loading file from prop:', filePathProp);
      setPropBasedContent({ path: filePathProp, content: '', loading: true, error: null });

      try {
        const content = await actions.readFile(filePathProp);
        setPropBasedContent({ path: filePathProp, content, loading: false, error: null });
      } catch (err) {
        console.error('[MarkdownPanel] Failed to load file:', err);
        setPropBasedContent({
          path: filePathProp,
          content: '',
          loading: false,
          error: err instanceof Error ? err : new Error(String(err)),
        });
      }
    };

    loadContent();
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
        fontSizeScale?: number;
      };
      if (payload.fontSizeScale !== undefined) {
        setFontSizeScale(payload.fontSizeScale);
      }
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

  // Get the active file from context slice (fallback when filePath prop not provided)
  const { activeFile: activeFileSlice } = context;

  // Determine which source to use: prop-based content or slice
  const usePropBasedContent = filePathProp && propBasedContent?.path === filePathProp;

  // Unified file state
  const activeFile = usePropBasedContent
    ? {
        data: {
          path: propBasedContent.path,
          content: propBasedContent.content,
          type: 'markdown' as const,
        },
        loading: propBasedContent.loading,
        error: propBasedContent.error,
      }
    : activeFileSlice;

  // Check if the active file is a markdown file
  const isMarkdown =
    activeFile?.data?.type === 'markdown' ||
    activeFile?.data?.path?.match(/\.(md|mdx|markdown)$/i);

  // Get markdown content
  const markdownContent = activeFile?.data?.content || '';
  const currentFilePath = activeFile?.data?.path || '';

  // Detect content changes and notify via callback + event
  useEffect(() => {
    const prev = previousContentRef.current;

    // Skip if no content yet or same file with same content
    if (!markdownContent || !currentFilePath) {
      return;
    }

    // Check if content actually changed (same file, different content)
    if (prev && prev.path === currentFilePath && prev.content !== markdownContent) {
      const changeInfo: ContentChangeInfo = {
        path: currentFilePath,
        previousContent: prev.content,
        newContent: markdownContent,
        charDiff: markdownContent.length - prev.content.length,
        timestamp: Date.now(),
      };

      // Call callback if provided
      if (onContentChange) {
        onContentChange(changeInfo);
      }

      // Emit event for other listeners
      events.emit({
        type: 'markdown-panel:content-changed',
        source: 'markdown-panel',
        timestamp: Date.now(),
        payload: changeInfo,
      });

      console.log('[MarkdownPanel] Content changed:', {
        path: currentFilePath,
        charDiff: changeInfo.charDiff,
      });
    }

    // Update ref with current content
    previousContentRef.current = { path: currentFilePath, content: markdownContent };
  }, [markdownContent, currentFilePath, onContentChange, events]);

  // Extract repository info from the file source for image URL transformation
  const repositoryInfo: RepositoryInfo | undefined = useMemo(() => {
    // Only slice-based content has source info; prop-based content doesn't
    if (usePropBasedContent || !activeFileSlice?.data) return undefined;

    const source = 'source' in activeFileSlice.data ? activeFileSlice.data.source : undefined;
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
      basePath: getBasePath(activeFileSlice?.data?.path || ''),
    };
  }, [usePropBasedContent, activeFileSlice?.data]);

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
        position: 'relative',
      }}
    >
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

      {!isMobile && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 6px',
            backgroundColor: theme.colors.backgroundLight,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: '6px',
            zIndex: 10,
          }}
        >
          <button
            onClick={handleFontSizeDecrease}
            title="Decrease Font Size"
            style={{
              background: 'none',
              border: `1px solid ${theme.colors.border}`,
              padding: '4px 6px',
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
              minWidth: '38px',
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
              padding: '4px 6px',
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
        </div>
      )}
    </div>
  );
};
