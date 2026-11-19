import FormCheckbox from '@/shared/components/form/FormCheckbox.vue'
import { findInputMessages } from '@/test/find-input-messages.ts'
import { dangerMessage } from '@/test/form-messages.ts'
import { getCheckbox } from '@/test/get-checkbox.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import { mount } from '@vue/test-utils'

type CheckboxProps = InstanceType<typeof FormCheckbox>['$props']

function mountCheckbox(
  props: Partial<CheckboxProps> = {},
  { attrs, slots }: { attrs?: Record<string, unknown>; slots?: Record<string, string> } = {}
) {
  return mount(FormCheckbox, {
    props: { label: 'Read only', modelValue: false, ...props },
    attrs,
    slots,
    global: createGlobalTestConfig(),
  })
}

it('renders its label', () => {
  expect(mountCheckbox().text()).toContain('Read only')
})

it('renders its default slot in place of its label', () => {
  const wrapper = mountCheckbox({}, { slots: { default: 'Read only, for now' } })

  expect(() => getCheckbox(wrapper, 'Read only, for now')).not.toThrow()
})

it('reflects its value', () => {
  expect(mountCheckbox({ modelValue: true }).getComponent(UiCheckbox).props('modelValue')).toBe(true)
  expect(mountCheckbox({ modelValue: false }).getComponent(UiCheckbox).props('modelValue')).toBe(false)
})

it('leaves its checkbox indeterminate when its model is undefined, as for a value which differs between edited repositories', () => {
  expect(mountCheckbox({ modelValue: undefined }).getComponent(UiCheckbox).props('modelValue')).toBeUndefined()
})

it('emits the new value when toggled', async () => {
  const wrapper = mountCheckbox()

  await wrapper.get('input').setValue(true)

  expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
})

it('ignores the validation bindings it receives with its field bindings', () => {
  const wrapper = mountCheckbox({}, { attrs: { error: dangerMessage('Required'), onBlur: () => {} } })

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

it('shows its info when given', () => {
  expect(findInputMessages(mountCheckbox({ info: 'For PV VMs only' }))).toEqual(['For PV VMs only'])
})

it.each<[string, Partial<CheckboxProps>]>([
  ['alone', {}],
  ['in place of its info', { info: 'For PV VMs only' }],
])('shows its info slot %s', (_case, props) => {
  expect(findInputMessages(mountCheckbox(props, { slots: { info: 'For HVM VMs too' } }))).toEqual(['For HVM VMs too'])
})

it('shows its info before its warnings', () => {
  expect(
    findInputMessages(mountCheckbox({ info: 'For PV VMs only', warning: 'The data cannot be recovered' }))
  ).toEqual(['For PV VMs only', 'The data cannot be recovered'])
})

it('disables its checkbox when it is disabled', () => {
  expect(mountCheckbox({ disabled: true }).getComponent(UiCheckbox).props('disabled')).toBe(true)
  expect(mountCheckbox().getComponent(UiCheckbox).props('disabled')).toBe(false)
})
