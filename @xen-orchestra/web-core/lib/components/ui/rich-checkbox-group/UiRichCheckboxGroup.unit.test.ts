import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLabel from '@core/components/ui/label/UiLabel.vue'
import type { RichCheckboxAccent } from '@core/components/ui/rich-checkbox/UiRichCheckbox.vue'
import UiRichCheckboxGroup from '@core/components/ui/rich-checkbox-group/UiRichCheckboxGroup.vue'
import { createGlobalTestConfig } from '@core-test/create-global-test-config.ts'
import { mount } from '@vue/test-utils'

type RichCheckboxGroupProps = {
  accent?: RichCheckboxAccent
  label?: string
  info?: string
  message?: string
  vertical?: boolean
}

function mountRichCheckboxGroup(props: RichCheckboxGroupProps = {}, slots: Record<string, string> = {}) {
  return mount(UiRichCheckboxGroup, {
    global: createGlobalTestConfig(),
    props: { accent: 'brand', ...props },
    slots: { default: '<span class="option">NFS backups</span>', ...slots },
  })
}

it('renders its options in a group', () => {
  expect(mountRichCheckboxGroup().get('[role="group"]').find('.option').text()).toBe('NFS backups')
})

it('names the group after its label', () => {
  const wrapper = mountRichCheckboxGroup({ label: 'Backup repositories' })
  const labelId = wrapper.get('[role="group"]').attributes('aria-labelledby')

  expect(wrapper.get(`[id="${labelId}"]`).text()).toBe('Backup repositories')
})

it('names the group after the label slot', () => {
  const wrapper = mountRichCheckboxGroup({}, { label: 'Custom label' })
  const labelId = wrapper.get('[role="group"]').attributes('aria-labelledby')

  expect(wrapper.get(`[id="${labelId}"]`).text()).toBe('Custom label')
})

it('leaves the group unnamed without a label', () => {
  const wrapper = mountRichCheckboxGroup()

  expect(wrapper.findComponent(UiLabel).exists()).toBe(false)
  expect(wrapper.get('[role="group"]').attributes('aria-labelledby')).toBeUndefined()
})

it.each([
  { accent: 'brand', labelAccent: 'neutral' },
  { accent: 'warning', labelAccent: 'warning' },
  { accent: 'danger', labelAccent: 'danger' },
] as const)('gives the label a $labelAccent accent with a $accent accent', ({ accent, labelAccent }) => {
  expect(mountRichCheckboxGroup({ accent, label: 'Label' }).getComponent(UiLabel).props('accent')).toBe(labelAccent)
})

it('applies the vertical variant only when set', () => {
  expect(mountRichCheckboxGroup({ vertical: true }).get('.group').classes()).toContain('vertical')
  expect(mountRichCheckboxGroup().get('.group').classes()).not.toContain('vertical')
})

it('shows the info with an info accent', () => {
  const info = mountRichCheckboxGroup({ info: 'Pick at least one' }).getComponent(UiInfo)

  expect(info.props('accent')).toBe('info')
  expect(info.text()).toBe('Pick at least one')
})

it.each([
  { accent: 'brand', infos: [] },
  { accent: 'warning', infos: ['warning'] },
  { accent: 'danger', infos: ['danger'] },
] as const)('shows the message only with a $accent accent other than brand', ({ accent, infos }) => {
  const wrapper = mountRichCheckboxGroup({ accent, message: 'Pick at least one' })

  expect(wrapper.findAllComponents(UiInfo).map(info => info.props('accent'))).toEqual(infos)
})
