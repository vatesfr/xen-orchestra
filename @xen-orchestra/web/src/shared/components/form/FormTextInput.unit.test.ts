import FormTextInput from '@/shared/components/form/FormTextInput.vue'
import { findInputLabels } from '@/test/find-input-labels.ts'
import { findInputMessages } from '@/test/find-input-messages.ts'
import { dangerMessage } from '@/test/form-messages.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { mount } from '@vue/test-utils'
import type { ComponentProps } from 'vue-component-type-helpers'

type TextInputProps = ComponentProps<typeof FormTextInput>

function mountTextInput(props: Partial<TextInputProps> = {}) {
  return mount(FormTextInput, {
    props: { label: 'Host', modelValue: '', ...props },
    global: createGlobalTestConfig(),
  })
}

it('renders its label', () => {
  expect(findInputLabels(mountTextInput())).toEqual(['Host'])
})

it('marks the input as required when asked to', () => {
  expect(mountTextInput({ required: true }).get('input').attributes()).toHaveProperty('required')
  expect(mountTextInput().get('input').attributes()).not.toHaveProperty('required')
})

it('shows its placeholder', () => {
  expect(mountTextInput({ placeholder: '192.168.1.10' }).get('input').attributes('placeholder')).toBe('192.168.1.10')
})

it('shows no message without information nor error', () => {
  expect(findInputMessages(mountTextInput())).toEqual([])
})

it('shows its information', () => {
  expect(findInputMessages(mountTextInput({ info: 'Root by default' }))).toEqual(['Root by default'])
})

it('shows its error', () => {
  expect(findInputMessages(mountTextInput({ error: dangerMessage('Host is required.') }))).toEqual([
    'Host is required.',
  ])
})

it('shows both its information and its error', () => {
  const wrapper = mountTextInput({ info: 'Root by default', error: dangerMessage('Host is required.') })

  expect(findInputMessages(wrapper).sort()).toEqual(['Host is required.', 'Root by default'])
})

it('trims the typed value', async () => {
  const wrapper = mountTextInput()

  await wrapper.get('input').setValue('  vcenter.lab  ')

  expect(wrapper.emitted('update:modelValue')).toEqual([['vcenter.lab']])
})

it('emits blur when the input loses focus', async () => {
  const wrapper = mountTextInput()

  await wrapper.get('input').trigger('blur')

  expect(wrapper.emitted('blur')).toHaveLength(1)
})

it('shows the prefix ahead of the value', () => {
  expect(mountTextInput({ prefix: '\\\\' }).get('.prefix').text()).toBe('\\\\')
})

it('disables the input when it is disabled', () => {
  expect(mountTextInput({ disabled: true }).get('input').attributes()).toHaveProperty('disabled')
  expect(mountTextInput().get('input').attributes()).not.toHaveProperty('disabled')
})

it('uses the input type it is given', () => {
  expect(mountTextInput({ type: 'password' }).get('input').attributes('type')).toBe('password')
})
