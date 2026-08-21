import UiLogEntryViewer from '@core/components/ui/log-entry-viewer/UiLogEntryViewer.vue'
import type { Meta, StoryObj } from '@storybook/vue3-vite'

const meta = {
  title: 'UI/UiLogEntryViewer',
  component: UiLogEntryViewer,
  tags: ['autodocs'],
  argTypes: {
    accent: {
      control: 'inline-radio',
      options: ['info', 'warning', 'danger'],
    },
    size: {
      control: 'inline-radio',
      options: ['small', 'medium'],
    },
    content: {
      control: 'object',
      description: 'Displayed as-is when it is a string, serialized as indented JSON when it is an object',
    },
  },
  args: {
    label: 'Label',
    content: 'A single line of content.',
    size: 'medium',
    accent: 'info',
  },
} satisfies Meta<typeof UiLogEntryViewer>

export default meta

type Story = StoryObj<typeof meta>

export const Info: Story = {
  args: {
    accent: 'info',
  },
}

export const Warning: Story = {
  args: {
    accent: 'warning',
  },
}

export const Danger: Story = {
  args: {
    accent: 'danger',
  },
}

export const Small: Story = {
  args: {
    size: 'small',
  },
}

export const ObjectContent: Story = {
  args: {
    label: 'Object content',
    content: {
      id: '3f2b1c8a',
      status: 'failure',
      attempts: 3,
      tags: ['first', 'second'],
      details: {
        code: 42,
        retryable: false,
      },
    },
  },
}

export const Scrollable: Story = {
  args: {
    label: 'Scrollable content',
    content: Array.from({ length: 40 }, (_, index) => `Line ${index + 1}`).join('\n'),
  },
}

export const Empty: Story = {
  args: {
    label: 'Empty content',
    content: undefined,
  },
}
