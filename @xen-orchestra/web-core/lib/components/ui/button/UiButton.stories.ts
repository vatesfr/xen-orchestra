import UiButton from '@core/components/ui/button/UiButton.vue'
import type { Meta, StoryObj } from '@storybook/vue3-vite'

const meta = {
  title: 'UI/UiButton',
  component: UiButton,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['primary', 'secondary', 'tertiary'],
    },
    accent: {
      control: 'inline-radio',
      options: ['brand', 'warning', 'danger'],
    },
    size: {
      control: 'inline-radio',
      options: ['small', 'medium'],
    },
    leftIcon: {
      control: 'select',
      options: [undefined, 'fa:plus', 'fa:trash', 'fa:pencil', 'fa:magnifying-glass', 'fa:rotate-left'],
    },
    default: {
      control: 'text',
      description: 'Button label',
    },
  },
  args: {
    variant: 'primary',
    accent: 'brand',
    size: 'medium',
    busy: false,
    disabled: false,
    lockIcon: false,
    default: 'Label',
  },
} satisfies Meta<typeof UiButton>

export default meta

type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    variant: 'primary',
  },
}

export const Secondary: Story = {
  args: {
    variant: 'secondary',
  },
}

export const Tertiary: Story = {
  args: {
    variant: 'tertiary',
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

export const WithLeftIcon: Story = {
  args: {
    leftIcon: 'fa:plus',
  },
}

export const Busy: Story = {
  args: {
    busy: true,
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
  },
}

export const Locked: Story = {
  args: {
    lockIcon: true,
  },
}
