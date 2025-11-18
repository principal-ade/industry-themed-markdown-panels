// Re-export types from panel-framework-core
export type {
  PanelEvent,
  PanelEventType,
  PanelContextValue,
  PanelActions,
  PanelEventEmitter,
  PanelComponentProps,
  PanelDefinition,
  PanelMetadata,
  PanelLifecycleHooks,
  RepositoryMetadata,
  DataSlice,
  ActiveFileSlice,
  FileTreeSource,
} from '@principal-ade/panel-framework-core';

/**
 * Git change status types.
 */
export type GitChangeSelectionStatus = 'staged' | 'unstaged' | 'untracked';

/**
 * Git status information data structure.
 */
export interface GitStatus {
  staged: string[];
  unstaged: string[];
  untracked: string[];
  deleted: string[];
}

/**
 * File tree node structure.
 */
export interface FileTree {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTree[];
}

/**
 * Markdown file metadata.
 */
export interface MarkdownFile {
  path: string;
  title?: string;
  lastModified: number;
}

/**
 * Package layer information.
 */
export interface PackageLayer {
  name: string;
  version: string;
  path: string;
}

/**
 * Code quality metrics.
 */
export interface QualityMetrics {
  coverage?: number;
  issues?: number;
  complexity?: number;
}
