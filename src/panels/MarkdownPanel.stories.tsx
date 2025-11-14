import type { Meta, StoryObj } from '@storybook/react';
import { MarkdownPanel } from './MarkdownPanel';
import { createMockPanelContext } from '../mocks/panelContext';
import { ThemeProvider, slateTheme } from '@a24z/industry-theme';

const meta = {
  title: 'Panels/MarkdownPanel',
  component: MarkdownPanel,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ThemeProvider initialTheme={slateTheme}>
        <div style={{ height: '100vh', width: '100vw' }}>
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
} satisfies Meta<typeof MarkdownPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

// Create default mock context
const mockContext = createMockPanelContext({
  repositoryPath: '/Users/example/my-project',
  repository: {
    name: 'my-project',
    branch: 'main',
  },
});

export const Default: Story = {
  args: {
    context: mockContext.context,
    actions: mockContext.actions,
    events: mockContext.events,
  },
};

export const WithRepository: Story = {
  args: {
    context: {
      ...mockContext.context,
      repositoryPath: '/Users/example/awesome-project',
      repository: {
        name: 'awesome-project',
        branch: 'feature/new-feature',
      },
    },
    actions: mockContext.actions,
    events: mockContext.events,
  },
};

export const NoRepository: Story = {
  args: {
    context: {
      ...mockContext.context,
      repositoryPath: null,
      repository: null,
    },
    actions: mockContext.actions,
    events: mockContext.events,
  },
};
