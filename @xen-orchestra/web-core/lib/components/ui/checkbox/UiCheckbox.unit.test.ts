import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import type { CheckboxModel } from '@core/composables/checkbox-state.composable.ts'
import { createGlobalTestConfig } from '@core-test/create-global-test-config.ts'
import { mount } from '@vue/test-utils'

type CheckboxProps = {
  accent?: 'brand' | 'warning' | 'danger'
  modelValue?: CheckboxModel
  value?: string
  disabled?: boolean
}

function mountCheckbox(props: CheckboxProps = {}) {
  return mount(UiCheckbox, {
    global: createGlobalTestConfig(),
    props: { accent: 'brand', modelValue: false, ...props },
    slots: { default: 'Auto power on' },
  })
}

it('shows a partly checked model on the checkbox and the input', () => {
  const wrapper = mountCheckbox({ modelValue: undefined })

  expect(wrapper.getComponent(VtsIcon).props('name')).toBe('status:checkbox-partially-checked')
  expect(wrapper.get('input').element.indeterminate).toBe(true)
})

it('adds its value to an array model', async () => {
  const wrapper = mountCheckbox({ modelValue: ['s3'], value: 'nfs' })

  await wrapper.get('input').setValue(true)

  expect(wrapper.emitted('update:modelValue')).toEqual([[['s3', 'nfs']]])
})

it('reads its value in an array model', () => {
  const icon = mountCheckbox({ modelValue: ['nfs'], value: 'nfs' }).getComponent(VtsIcon)

  expect(icon.props('name')).toBe('status:checkbox-checked')
})

it('applies the disabled variant to the label and disables the input', () => {
  const wrapper = mountCheckbox({ disabled: true })

  expect(wrapper.get('.checkbox-label').classes()).toContain('disabled')
  expect(wrapper.get('input').attributes()).toHaveProperty('disabled')
})
