import UiInput from '@core/components/ui/input/UiInput.vue'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { useArgs } from 'storybook/preview-api'

const meta = {
  title: 'UI/UiInput',
  component: UiInput,
  tags: ['autodocs'],
  argTypes: {
    accent: {
      control: 'inline-radio',
      options: ['neutral', 'success', 'warning', 'danger'],
    },
    type: {
      control: 'inline-radio',
      options: ['text', 'number', 'password', 'search'],
    },
    rightIcon: {
      control: 'select',
      options: [undefined, 'fa:magnifying-glass', 'fa:pencil', 'fa:plus'],
    },
  },
  args: {
    accent: 'neutral',
    modelValue: 'Value',
    type: 'text',
    busy: false,
    clearable: false,
    disabled: false,
    readonly: false,
    required: false,
    selected: false,
  },
  // `v-model` is not wired by Storybook: write the emitted value back to the args so the field reacts to typing
  render: args => {
    const [, updateArgs] = useArgs()

    return {
      components: { UiInput },
      setup: () => ({
        args,
        updateModelValue: (modelValue: string | number | undefined) => updateArgs({ modelValue }),
      }),
      template: '<UiInput v-bind="args" @update:model-value="updateModelValue" />',
    }
  },
} satisfies Meta<typeof UiInput>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Empty: Story = {
  args: {
    modelValue: '',
  },
}

export const Success: Story = {
  args: {
    accent: 'success',
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

export const Clearable: Story = {
  args: {
    clearable: true,
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

export const Readonly: Story = {
  args: {
    readonly: true,
  },
}

export const WithRightIcon: Story = {
  args: {
    rightIcon: 'fa:magnifying-glass',
  },
}

export const WithPrefixAndSuffix: Story = {
  args: {
    type: 'number',
    modelValue: 8,
    prefix: 'RAM',
    suffix: 'GiB',
  },
}
