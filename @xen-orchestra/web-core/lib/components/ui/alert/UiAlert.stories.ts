import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { fn } from 'storybook/test'

const meta = {
  title: 'UI/UiAlert',
  component: UiAlert,
  tags: ['autodocs'],
  argTypes: {
    accent: {
      control: 'inline-radio',
      options: ['info', 'success', 'warning', 'danger'],
    },
    default: {
      control: 'text',
      description: 'Main alert message',
    },
    description: {
      control: 'text',
      description: 'Additional details displayed below the message',
    },
  },
  args: {
    accent: 'info',
    close: false,
    default: 'The operation completed successfully.',
    onClose: fn(),
  },
} satisfies Meta<typeof UiAlert>

export default meta

type Story = StoryObj<typeof meta>

export const Info: Story = {
  args: {
    accent: 'info',
    default: 'A new version of Xen Orchestra is available.',
  },
}

export const Success: Story = {
  args: {
    accent: 'success',
    default: 'The virtual machine has been created.',
  },
}

export const Warning: Story = {
  args: {
    accent: 'warning',
    default: 'This pool has hosts running different XCP-ng versions.',
  },
}

export const Danger: Story = {
  args: {
    accent: 'danger',
    default: 'The backup job failed on 3 virtual machines.',
  },
}

export const WithDescription: Story = {
  args: {
    accent: 'warning',
    default: 'The host is in maintenance mode.',
    description: 'Virtual machines running on this host have been migrated to the rest of the pool.',
  },
}

export const Closable: Story = {
  args: {
    accent: 'info',
    close: true,
    default: 'Click the close button to emit the `close` event.',
  },
}
