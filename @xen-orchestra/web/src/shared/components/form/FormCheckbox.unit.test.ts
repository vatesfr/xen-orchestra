import FormCheckbox from '@/shared/components/form/FormCheckbox.vue'
import { findInputMessages } from '@/test/find-input-messages.ts'
import { dangerMessage } from '@/test/form-messages.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { mount } from '@vue/test-utils'
import type { ComponentProps } from 'vue-component-type-helpers'

type CheckboxProps = ComponentProps<typeof FormCheckbox>

function mountCheckbox(props: Partial<CheckboxProps> = {}, attrs: Record<string, unknown> = {}) {
  return mount(FormCheckbox, {
    props: { label: 'Read only', modelValue: false, ...props },
    attrs,
    global: createGlobalTestConfig(),
  })
}

it('renders its label', () => {
  expect(mountCheckbox().text()).toContain('Read only')
})

it('reflects its value', () => {
  expect(mountCheckbox({ modelValue: true }).get<HTMLInputElement>('input').element.checked).toBe(true)
  expect(mountCheckbox({ modelValue: false }).get<HTMLInputElement>('input').element.checked).toBe(false)
})

it('emits the new value when toggled', async () => {
  const wrapper = mountCheckbox()

  await wrapper.get('input').setValue(true)

  expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
})

it('ignores the validation bindings it receives with its field bindings', () => {
  const wrapper = mountCheckbox({}, { error: dangerMessage('Required'), onBlur: () => {} })

  expect(findInputMessages(wrapper)).toEqual([])
  expect(wrapper.attributes()).not.toHaveProperty('error')
})

it('shows no warning when none is given', () => {
  expect(findInputMessages(mountCheckbox())).toEqual([])
})

it.each<[string, CheckboxProps['warning']]>([
  ['a text', 'The data cannot be recovered'],
  ['a message', { content: 'The data cannot be recovered', accent: 'warning' }],
])('shows the warning given as %s', (_case, warning) => {
  expect(findInputMessages(mountCheckbox({ warning }))).toEqual(['The data cannot be recovered'])
})

it('shows every warning when several are given', () => {
  const warning = ['The data cannot be recovered', 'Another warning']

  expect(findInputMessages(mountCheckbox({ warning }))).toEqual(warning)
})

it('cannot be checked when it is disabled', () => {
  expect(mountCheckbox({ disabled: true }).get('input').attributes()).toHaveProperty('disabled')
  expect(mountCheckbox().get('input').attributes()).not.toHaveProperty('disabled')
})
