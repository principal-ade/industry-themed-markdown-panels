import React from 'react';
import type {
  PanelComponentProps,
  PanelContextValue,
  PanelActions,
  PanelEventEmitter,
  PanelEvent,
  GitStatus,
} from '../types';

/**
 * Mock Git Status for Storybook
 */
export const mockGitStatus: GitStatus = {
  staged: ['src/components/Button.tsx', 'src/styles/theme.css'],
  unstaged: ['README.md', 'package.json'],
  untracked: ['src/new-feature.tsx'],
  deleted: [],
};

/**
 * Mock Panel Context for Storybook
 */
export const createMockContext = <TData = {}>(
  overrides?: Partial<PanelContextValue<TData>>
): PanelContextValue<TData> => {
  return {
    currentScope: {
      type: 'repository' as const,
      repository: {
        name: 'my-project',
        path: '/Users/developer/my-project',
        branch: 'main',
        remote: 'origin',
      },
    },
    refresh: async () => {
      console.log('[Mock] Context refresh called');
    },
    ...overrides,
  } as PanelContextValue<TData>;
};

/**
 * Mock Panel Actions for Storybook
 */
export const createMockActions = (
  overrides?: Partial<PanelActions>
): PanelActions => ({
  openFile: (filePath: string) => {
    console.log('[Mock] Opening file:', filePath);
  },
  openGitDiff: (filePath: string, status) => {
    console.log('[Mock] Opening git diff:', filePath, status);
  },
  navigateToPanel: (panelId: string) => {
    console.log('[Mock] Navigating to panel:', panelId);
  },
  notifyPanels: (event) => {
    console.log('[Mock] Notifying panels:', event);
  },
  ...overrides,
});

/**
 * Mock Event Emitter for Storybook
 */
export const createMockEvents = (): PanelEventEmitter => {
  const handlers = new Map<string, Set<(event: PanelEvent) => void>>();

  return {
    emit: (event) => {
      console.log('[Mock] Emitting event:', event);
      const eventHandlers = handlers.get(event.type);
      if (eventHandlers) {
        eventHandlers.forEach((handler) => handler(event));
      }
    },
    on: (type, handler) => {
      console.log('[Mock] Subscribing to event:', type);
      if (!handlers.has(type)) {
        handlers.set(type, new Set());
      }
      handlers.get(type)!.add(handler as any);

      // Return cleanup function
      return () => {
        console.log('[Mock] Unsubscribing from event:', type);
        handlers.get(type)?.delete(handler as any);
      };
    },
    off: (type, handler) => {
      console.log('[Mock] Removing event handler:', type);
      handlers.get(type)?.delete(handler as any);
    },
  };
};

/**
 * Create complete mock panel context props
 * Utility for creating all panel props at once
 */
export const createMockPanelContext = (
  contextOverrides?: Partial<PanelContextValue>,
  actionsOverrides?: Partial<PanelActions>,
): PanelComponentProps => {
  return {
    context: createMockContext(contextOverrides),
    actions: createMockActions(actionsOverrides),
    events: createMockEvents(),
  };
};

/**
 * Mock Panel Props Provider
 * Wraps components with mock context for Storybook
 */
export const MockPanelProvider: React.FC<{
  children: (props: PanelComponentProps) => React.ReactNode;
  contextOverrides?: Partial<PanelContextValue>;
  actionsOverrides?: Partial<PanelActions>;
}> = ({ children, contextOverrides, actionsOverrides }) => {
  const mockProps = createMockPanelContext(contextOverrides, actionsOverrides);
  return <>{children(mockProps)}</>;
};
