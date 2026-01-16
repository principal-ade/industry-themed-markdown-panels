import { MarkdownPanel } from './panels/MarkdownPanel';
import type { MarkdownPanelProps } from './panels/MarkdownPanel';
import type { PanelDefinition, PanelContextValue } from './types';
import { markdownPanelTools, markdownPanelToolsMetadata } from './tools';

// Export the component and its props type
export { MarkdownPanel };
export type { MarkdownPanelProps };

/**
 * Export array of panel definitions.
 * This is the required export for panel extensions.
 */
export const panels: PanelDefinition[] = [
  {
    metadata: {
      id: 'principal-ade.markdown-viewer',
      name: 'Markdown Viewer',
      icon: '📄',
      version: '0.2.0',
      author: 'Principal ADE',
      description: 'Themed markdown rendering panel with document and slide views',
      // UTCP-compatible tools this panel exposes
      tools: markdownPanelTools,
    },
    component: MarkdownPanel,

    // Optional: Called when this specific panel is mounted
    onMount: async (context: PanelContextValue) => {
      console.log('Markdown Panel mounted');
      const repository = context.currentScope.repository;
      console.log('Repository:', repository?.path);
    },

    // Optional: Called when this specific panel is unmounted
    onUnmount: async (_context: PanelContextValue) => {
      console.log('Markdown Panel unmounting');
    },
  },
];

/**
 * Optional: Called once when the entire package is loaded.
 * Use this for package-level initialization.
 */
export const onPackageLoad = async () => {
  console.log('Panel package loaded - Industry-Themed Markdown Panels');
};

/**
 * Optional: Called once when the package is unloaded.
 * Use this for package-level cleanup.
 */
export const onPackageUnload = async () => {
  console.log('Panel package unloading - Industry-Themed Markdown Panels');
};

/**
 * Export tools for server-safe imports.
 * Use '@industry-theme/markdown-panels/tools' to import without React dependencies.
 */
export {
  markdownPanelTools,
  markdownPanelToolsMetadata,
  scrollToSectionTool,
  navigateSlideTool,
  changeFontSizeTool,
} from './tools';
