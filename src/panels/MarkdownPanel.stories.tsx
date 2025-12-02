import type { Meta, StoryObj } from '@storybook/react-vite';
import { MarkdownPanel } from './MarkdownPanel';
import { createMockPanelContext } from '../mocks/panelContext';
import { ThemeProvider, slateTheme } from '@principal-ade/industry-theme';

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

// Helper to create context with active markdown file
const createMarkdownContext = (content: string, filename = 'README.md') => {
  const mockContext = createMockPanelContext();

  // Add active-file slice
  (mockContext.context.slices as Map<string, any>).set('active-file', {
    scope: 'repository' as const,
    name: 'active-file',
    data: {
      path: `/Users/example/my-project/${filename}`,
      type: 'markdown' as const,
      content: content,
      source: {
        type: 'local' as const,
        name: 'my-project',
      },
    },
    loading: false,
    error: null,
    refresh: async () => {
      console.log('[Mock] Refreshing active-file slice');
    },
  });

  return mockContext;
};

export const Default: Story = {
  args: createMarkdownContext(sampleMarkdown),
};

export const Presentation: Story = {
  args: createMarkdownContext(presentationMarkdown, 'presentation.md'),
};

export const NoFile: Story = {
  args: createMockPanelContext(),
};
