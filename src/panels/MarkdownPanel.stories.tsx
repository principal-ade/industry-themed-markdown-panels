import { useState, useEffect, useCallback, useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MarkdownPanel, type ContentChangeInfo } from './MarkdownPanel';
import { createMockPanelContext, createMockContext, createMockActions, createMockEvents } from '../mocks/panelContext';
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
- Document layout
- Font size controls

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

// Content versions for simulating file changes
const contentVersions = [
  {
    label: 'Version 1 - Initial',
    content: `# Project Status

## Current Sprint

We're working on the authentication module.

### Tasks
- [ ] User login flow
- [ ] Password reset
- [ ] Session management

## Notes

Initial planning phase.
`,
  },
  {
    label: 'Version 2 - Progress Update',
    content: `# Project Status

## Current Sprint

We're working on the authentication module.

### Tasks
- [x] User login flow
- [ ] Password reset
- [ ] Session management

## Notes

Initial planning phase.

> Login flow completed! Moving to password reset next.
`,
  },
  {
    label: 'Version 3 - More Progress',
    content: `# Project Status

## Current Sprint

We're working on the authentication module.

### Tasks
- [x] User login flow
- [x] Password reset
- [ ] Session management

## Notes

Initial planning phase.

> Login flow completed! Moving to password reset next.

### Code Example

\`\`\`typescript
async function resetPassword(email: string) {
  const token = await generateResetToken(email);
  await sendResetEmail(email, token);
}
\`\`\`
`,
  },
  {
    label: 'Version 4 - Complete',
    content: `# Project Status

## Current Sprint

Authentication module **complete**!

### Tasks
- [x] User login flow
- [x] Password reset
- [x] Session management

## Notes

All tasks finished ahead of schedule.

> Login flow completed! Moving to password reset next.

### Code Example

\`\`\`typescript
async function resetPassword(email: string) {
  const token = await generateResetToken(email);
  await sendResetEmail(email, token);
}
\`\`\`

---

# Next Sprint Preview

## Upcoming Work

- API rate limiting
- Audit logging
- 2FA support
`,
  },
];

// Wrapper component that simulates content changes
const ContentChangeSimulator: React.FC<{
  autoPlay?: boolean;
  intervalMs?: number;
}> = ({ autoPlay = false, intervalMs = 2000 }) => {
  const [versionIndex, setVersionIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [lastChange, setLastChange] = useState<ContentChangeInfo | null>(null);
  const [changeHistory, setChangeHistory] = useState<ContentChangeInfo[]>([]);
  const eventsRef = useRef(createMockEvents());

  const currentVersion = contentVersions[versionIndex];

  const goToVersion = useCallback((newIndex: number) => {
    setVersionIndex(newIndex);
    console.log('[Simulator] Switching to version:', contentVersions[newIndex].label);
  }, []);

  const nextVersion = useCallback(() => {
    const newIndex = (versionIndex + 1) % contentVersions.length;
    goToVersion(newIndex);
  }, [versionIndex, goToVersion]);

  const prevVersion = useCallback(() => {
    const newIndex = (versionIndex - 1 + contentVersions.length) % contentVersions.length;
    goToVersion(newIndex);
  }, [versionIndex, goToVersion]);

  // Handle content change callback from MarkdownPanel
  const handleContentChange = useCallback((change: ContentChangeInfo) => {
    console.log('[Simulator] Panel detected content change:', change);
    setLastChange(change);
    setChangeHistory((prev) => [...prev.slice(-4), change]); // Keep last 5 changes
  }, []);

  // Auto-play timer
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(nextVersion, intervalMs);
    return () => clearInterval(timer);
  }, [isPlaying, intervalMs, nextVersion]);

  const mockProps = {
    context: {
      ...createMockContext(),
      activeFile: {
        scope: 'repository' as const,
        name: 'active-file',
        data: {
          path: '/Users/example/my-project/STATUS.md',
          type: 'markdown' as const,
          content: currentVersion.content,
          source: mockSource,
        },
        loading: false,
        error: null,
        refresh: async () => {
          console.log('[Mock] Refreshing - simulating file reload');
        },
      },
    },
    actions: {
      ...createMockActions(),
      readFile: async (path: string) => {
        console.log('[Mock] Reading file:', path);
        return currentVersion.content;
      },
    },
    events: eventsRef.current,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Control Panel */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #333',
          background: '#1a1a2e',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={prevVersion}
            style={{
              padding: '6px 12px',
              background: '#2d2d44',
              border: '1px solid #444',
              borderRadius: '4px',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Prev
          </button>
          <button
            onClick={nextVersion}
            style={{
              padding: '6px 12px',
              background: '#2d2d44',
              border: '1px solid #444',
              borderRadius: '4px',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Next
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            style={{
              padding: '6px 12px',
              background: isPlaying ? '#4a3' : '#2d2d44',
              border: '1px solid #444',
              borderRadius: '4px',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            {isPlaying ? 'Pause' : 'Auto-play'}
          </button>
        </div>

        <div style={{ color: '#888', fontSize: '13px' }}>
          <span style={{ color: '#6af' }}>{currentVersion.label}</span>
          <span style={{ marginLeft: '8px' }}>
            ({versionIndex + 1} / {contentVersions.length})
          </span>
        </div>

        {/* Version quick-select */}
        <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
          {contentVersions.map((v, i) => (
            <button
              key={i}
              onClick={() => goToVersion(i)}
              style={{
                width: '28px',
                height: '28px',
                padding: 0,
                background: i === versionIndex ? '#6af' : '#2d2d44',
                border: '1px solid #444',
                borderRadius: '4px',
                color: i === versionIndex ? '#000' : '#fff',
                cursor: 'pointer',
                fontWeight: i === versionIndex ? 'bold' : 'normal',
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Change detection info from MarkdownPanel callback */}
      {lastChange && (
        <div
          style={{
            padding: '8px 16px',
            background: '#1e2a1e',
            borderBottom: '1px solid #444',
            fontSize: '12px',
            color: '#8a8',
            fontFamily: 'monospace',
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
          }}
        >
          <span style={{ color: '#6f6' }}>onContentChange fired!</span>
          <span>
            {lastChange.previousContent.length} → {lastChange.newContent.length} chars
          </span>
          <span style={{ color: lastChange.charDiff > 0 ? '#6f6' : '#f66' }}>
            ({lastChange.charDiff > 0 ? '+' : ''}{lastChange.charDiff})
          </span>
          <span style={{ color: '#666' }}>
            {new Date(lastChange.timestamp).toLocaleTimeString()}
          </span>
        </div>
      )}

      {/* Change history */}
      {changeHistory.length > 1 && (
        <div
          style={{
            padding: '4px 16px',
            background: '#1a1a1e',
            borderBottom: '1px solid #333',
            fontSize: '11px',
            color: '#666',
            fontFamily: 'monospace',
          }}
        >
          History: {changeHistory.map((c, i) => (
            <span key={i} style={{ marginRight: '8px', color: c.charDiff > 0 ? '#484' : '#844' }}>
              {c.charDiff > 0 ? '+' : ''}{c.charDiff}
            </span>
          ))}
        </div>
      )}

      {/* The actual MarkdownPanel */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <MarkdownPanel {...mockProps} onContentChange={handleContentChange} />
      </div>
    </div>
  );
};

export const ContentChangeSimulation: Story = {
  args: createMarkdownContext(contentVersions[0].content, 'STATUS.md'),
  render: () => <ContentChangeSimulator />,
  parameters: {
    docs: {
      description: {
        story: 'Simulates file content changes to test live-reload behavior. Use the controls to step through versions or enable auto-play.',
      },
    },
  },
};

export const ContentChangeAutoPlay: Story = {
  args: createMarkdownContext(contentVersions[0].content, 'STATUS.md'),
  render: () => <ContentChangeSimulator autoPlay intervalMs={3000} />,
  parameters: {
    docs: {
      description: {
        story: 'Auto-plays through content versions every 3 seconds.',
      },
    },
  },
};
