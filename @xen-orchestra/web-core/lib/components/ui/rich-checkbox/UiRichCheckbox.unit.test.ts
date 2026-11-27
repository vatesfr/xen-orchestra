import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiRichCheckbox, { type RichCheckboxAccent } from '@core/components/ui/rich-checkbox/UiRichCheckbox.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import type { CheckboxModel } from '@core/composables/checkbox-state.composable.ts'
import type { IconName } from '@core/icons'
import { createGlobalTestConfig } from '@core-test/create-global-test-config.ts'
import { mount, type VueWrapper } from '@vue/test-utils'

type RichCheckboxProps = {
  accent?: RichCheckboxAccent
  modelValue?: CheckboxModel
  value?: string
  icon?: IconName
  tag?: string
  description?: string
  message?: string
  disabled?: boolean
  'onUpdate:modelValue'?: (model: CheckboxModel) => void
}

function mountRichCheckbox(props: RichCheckboxProps = {}) {
  return mount(UiRichCheckbox, {
    global: createGlobalTestConfig(),
    props: { accent: 'brand', modelValue: false, ...props },
    slots: { default: 'NFS backups' },
  })
}

function readIconNames(wrapper: VueWrapper) {
  return wrapper.findAllComponents(VtsIcon).map(icon => icon.props('name'))
}

it.each([
  { model: true, classes: ['checked'], icon: 'status:checkbox-checked' },
  { model: undefined, classes: ['indeterminate'], icon: 'status:checkbox-partially-checked' },
  { model: false, classes: [], icon: 'status:checkbox' },
])('shows the $model model on the card and the checkbox', ({ model, classes, icon }) => {
  const wrapper = mountRichCheckbox({ modelValue: model })

  expect(wrapper.classes().filter(className => ['checked', 'indeterminate'].includes(className))).toEqual(classes)
  expect(readIconNames(wrapper)).toEqual([icon])
  expect(wrapper.get('input').element.indeterminate).toBe(model === undefined)
})

it('keeps showing the model when the parent rejects the change', async () => {
  const wrapper = mountRichCheckbox({ modelValue: false, 'onUpdate:modelValue': () => undefined })

  await wrapper.get('input').setValue(true)

  expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
  expect(wrapper.classes()).not.toContain('checked')
  expect(readIconNames(wrapper)).toEqual(['status:checkbox'])
})

it('adds its value to an array model', async () => {
  const wrapper = mountRichCheckbox({ modelValue: ['s3'], value: 'nfs' })

  await wrapper.get('input').setValue(true)

  expect(wrapper.emitted('update:modelValue')).toEqual([[['s3', 'nfs']]])
})

it('applies the accent and the disabled variant', () => {
  const wrapper = mountRichCheckbox({ accent: 'warning', disabled: true })

  expect(wrapper.classes()).toEqual(expect.arrayContaining(['accent--warning', 'disabled']))
  expect(wrapper.get('input').attributes()).toHaveProperty('disabled')
})

it('names the checkbox after its heading', () => {
  const wrapper = mountRichCheckbox({ tag: 'Source' })
  const heading = wrapper.get('.heading')

  expect(wrapper.get('input').attributes('aria-labelledby')).toBe(heading.attributes('id'))
  expect(heading.text()).toContain('NFS backups')
  expect(wrapper.getComponent(UiTag).props('accent')).toBe('info')
  expect(wrapper.getComponent(UiTag).text()).toBe('Source')
})

it('describes the checkbox with its description', () => {
  const wrapper = mountRichCheckbox({ description: '4.2 TiB free' })
  const description = wrapper.get('.description')

  expect(description.text()).toBe('4.2 TiB free')
  expect(wrapper.get('input').attributes('aria-describedby')).toBe(description.attributes('id'))
})

it('renders no tag and no description when none is given', () => {
  const wrapper = mountRichCheckbox()

  expect(wrapper.findComponent(UiTag).exists()).toBe(false)
  expect(wrapper.find('.description').exists()).toBe(false)
  expect(wrapper.get('input').attributes('aria-describedby')).toBeUndefined()
})

it('renders the icon it is given after the checkbox', () => {
  expect(readIconNames(mountRichCheckbox({ icon: 'fa:server' }))).toEqual(['status:checkbox', 'fa:server'])
})

it.each([
  { accent: 'brand', infos: [] },
  { accent: 'warning', infos: ['warning'] },
  { accent: 'danger', infos: ['danger'] },
] as const)('shows the message only with a $accent accent other than brand', ({ accent, infos }) => {
  const wrapper = mountRichCheckbox({ accent, message: 'Not enough space' })

  expect(wrapper.findAllComponents(UiInfo).map(info => info.props('accent'))).toEqual(infos)
})
