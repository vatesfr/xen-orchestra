import FormPasswordInput from '@/shared/components/form/FormPasswordInput.vue'
import { findInputLabels } from '@/test/find-input-labels.ts'
import { findInputMessages } from '@/test/find-input-messages.ts'
import { invalidCredentialsMessage } from '@/test/form-messages.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import UiInput from '@core/components/ui/input/UiInput.vue'
import { mount } from '@vue/test-utils'
import type { ComponentProps } from 'vue-component-type-helpers'

type PasswordInputProps = ComponentProps<typeof FormPasswordInput>

function mountPasswordInput(props: Partial<PasswordInputProps> = {}) {
  return mount(FormPasswordInput, {
    props: { label: 'Password', modelValue: 'secret', ...props },
    global: createGlobalTestConfig(),
  })
}

it('renders its label', () => {
  expect(findInputLabels(mountPasswordInput())).toEqual(['Password'])
})

it('hides the typed password', () => {
  expect(mountPasswordInput().getComponent(UiInput).props('type')).toBe('password')
})

it('marks the input as required when asked to', () => {
  expect(mountPasswordInput({ required: true }).getComponent(UiInput).props('required')).toBe(true)
  expect(mountPasswordInput().getComponent(UiInput).props('required')).toBe(false)
})

it('keeps the password untrimmed', async () => {
  const wrapper = mountPasswordInput()

  await wrapper.get('input').setValue(' secret ')

  expect(wrapper.emitted('update:modelValue')).toEqual([[' secret ']])
})

it('shows no message without error', () => {
  expect(findInputMessages(mountPasswordInput())).toEqual([])
})

it('shows its error', () => {
  expect(findInputMessages(mountPasswordInput({ error: invalidCredentialsMessage() }))).toEqual([
    invalidCredentialsMessage().content,
  ])
})

it('emits blur when the input loses focus', async () => {
  const wrapper = mountPasswordInput()

  await wrapper.get('input').trigger('blur')

  expect(wrapper.emitted('blur')).toHaveLength(1)
})
