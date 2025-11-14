import { MarkdownPanel } from './panels/MarkdownPanel';
import type { PanelDefinition, PanelContextValue } from './types';

/**
 * Export array of panel definitions.
 * This is the required export for panel extensions.
 */
export const panels: PanelDefinition[] = [
  {
    id: 'principal-ade.markdown-viewer',
    name: 'Markdown Viewer',
    icon: '📄',
    version: '0.1.0',
    author: 'Principal ADE',
    description: 'Themed markdown rendering panel with document and slide views',
    component: MarkdownPanel,

    // Optional: Called when this specific panel is mounted
    onMount: async (context: PanelContextValue) => {
      console.log('Markdown Panel mounted');
      console.log('Repository:', context.repositoryPath);
    },

    // Optional: Called when this specific panel is unmounted
    onUnmount: async (_context: PanelContextValue) => {
      console.log('Markdown Panel unmounting');
    },

    // Optional: Called when data slices change
    onDataChange: (slice, data) => {
      console.log(`Data changed for slice: ${slice}`, data);
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
