import type { Meta, StoryObj } from '@storybook/react-vite';
import { MarkdownPanel } from './MarkdownPanel';
import { createMockPanelContext } from '../mocks/panelContext';
import { ThemeProvider, slateTheme } from '@principal-ade/industry-theme';
import { createFileTreeSource } from '@principal-ai/repository-abstraction';

const meta = {
  title: 'Panels/MarkdownPanel',
  component: MarkdownPanel,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ThemeProvider theme={slateTheme}>
        <div style={{ height: '100vh', width: '100vw' }}>
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
} satisfies Meta<typeof MarkdownPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample markdown content for stories
const sampleMarkdown = `# Welcome to Markdown Panel

This is a demonstration of the Markdown Panel with industry theming support.

## Features

- **Themed rendering** using industry-theme
- Support for both document and book view modes
- Font size controls
- Slide navigation for presentations

## Code Example

\`\`\`typescript
const greet = (name: string) => {
  console.log(\`Hello, \${name}!\`);
};

greet('World');
\`\`\`

## Lists

### Unordered List
- First item
- Second item
- Third item

### Ordered List
1. First step
2. Second step
3. Third step

## Blockquote

> This is a blockquote example.
> It can span multiple lines.

---

# Slide 2

This is the second slide in the presentation.

## More Content

You can create multiple slides by using horizontal rules (\`---\`).
`;

const presentationMarkdown = `# Introduction

Welcome to the presentation!

---

# Main Content

## Key Points

- Point 1
- Point 2
- Point 3

---

# Conclusion

Thank you for viewing!
`;

// Create a mock FileTreeSource using the factory
const mockSource = createFileTreeSource.localWorkingCopy(
  '/Users/example/my-project',
  'example-org',
  'my-project',
  'https://github.com/example-org/my-project',
  'main'
);

// Helper to create context with active markdown file
const createMarkdownContext = (content: string, filename = 'README.md') => {
  const mockContext = createMockPanelContext();

  // Add activeFile slice directly to context
  const contextWithActiveFile = {
    ...mockContext,
    context: {
      ...mockContext.context,
      activeFile: {
        scope: 'repository' as const,
        name: 'active-file',
        data: {
          path: `/Users/example/my-project/${filename}`,
          type: 'markdown' as const,
          content: content,
          source: mockSource,
        },
        loading: false,
        error: null,
        refresh: async () => {
          console.log('[Mock] Refreshing active-file slice');
        },
      },
    },
    actions: {
      ...mockContext.actions,
      readFile: async (path: string) => {
        console.log('[Mock] Reading file:', path);
        return content;
      },
    },
  };

  return contextWithActiveFile;
};

export const Default: Story = {
  args: createMarkdownContext(sampleMarkdown),
};

export const Presentation: Story = {
  args: createMarkdownContext(presentationMarkdown, 'presentation.md'),
};

export const NoFile: Story = {
  args: (() => {
    const mockContext = createMockPanelContext();
    return {
      ...mockContext,
      context: {
        ...mockContext.context,
        activeFile: {
          scope: 'repository' as const,
          name: 'active-file',
          data: null,
          loading: false,
          error: null,
          refresh: async () => {},
        },
      },
      actions: {
        ...mockContext.actions,
        readFile: async (path: string) => {
          console.log('[Mock] Reading file:', path);
          return '';
        },
      },
    };
  })(),
};
