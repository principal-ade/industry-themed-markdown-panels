/**
 * Panel Tools
 *
 * UTCP-compatible tools for the Markdown panel extension.
 * These tools can be invoked by AI agents and emit events that panels listen for.
 *
 * IMPORTANT: This file should NOT import any React components to ensure
 * it can be imported server-side without pulling in React dependencies.
 * Use the './tools' subpath export for server-safe imports.
 */

import type { PanelTool, PanelToolsMetadata } from '@principal-ade/utcp-panel-event';

/**
 * Tool: Scroll To Section
 */
export const scrollToSectionTool: PanelTool = {
  name: 'scroll_to_section',
  description: 'Scrolls the markdown panel to a specific heading section',
  inputs: {
    type: 'object',
    properties: {
      sectionId: {
        type: 'string',
        description: 'The ID or slug of the section heading to scroll to',
      },
      animate: {
        type: 'boolean',
        description: 'Whether to animate the scroll transition',
      },
    },
    required: ['sectionId'],
  },
  outputs: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      message: { type: 'string' },
    },
  },
  tags: ['markdown', 'navigation', 'scroll'],
  tool_call_template: {
    call_template_type: 'panel_event',
    event_type: 'industry-theme.markdown-panels:scroll-to-section',
  },
};

/**
 * Tool: Navigate Slide
 */
export const navigateSlideTool: PanelTool = {
  name: 'navigate_slide',
  description: 'Navigates to a specific slide in presentation mode',
  inputs: {
    type: 'object',
    properties: {
      slideIndex: {
        type: 'number',
        description: 'The index of the slide to navigate to (0-based)',
      },
      direction: {
        type: 'string',
        enum: ['next', 'previous', 'first', 'last'],
        description: 'Navigate relative to current slide',
      },
    },
  },
  outputs: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      currentSlide: { type: 'number' },
      totalSlides: { type: 'number' },
    },
  },
  tags: ['markdown', 'presentation', 'slide'],
  tool_call_template: {
    call_template_type: 'panel_event',
    event_type: 'industry-theme.markdown-panels:navigate-slide',
  },
};

/**
 * Tool: Change Font Size
 */
export const changeFontSizeTool: PanelTool = {
  name: 'change_font_size',
  description: 'Changes the font size of the markdown content',
  inputs: {
    type: 'object',
    properties: {
      size: {
        type: 'string',
        enum: ['small', 'medium', 'large'],
        description: 'The font size to apply',
      },
    },
    required: ['size'],
  },
  outputs: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      currentSize: { type: 'string' },
    },
  },
  tags: ['markdown', 'display', 'font'],
  tool_call_template: {
    call_template_type: 'panel_event',
    event_type: 'industry-theme.markdown-panels:change-font-size',
  },
};

/**
 * All tools exported as an array.
 */
export const markdownPanelTools: PanelTool[] = [
  scrollToSectionTool,
  navigateSlideTool,
  changeFontSizeTool,
];

/**
 * Panel tools metadata for registration with PanelToolRegistry.
 */
export const markdownPanelToolsMetadata: PanelToolsMetadata = {
  id: 'industry-theme.markdown-panels',
  name: 'Markdown Panel',
  description: 'Tools provided by the markdown rendering panel extension',
  tools: markdownPanelTools,
};
