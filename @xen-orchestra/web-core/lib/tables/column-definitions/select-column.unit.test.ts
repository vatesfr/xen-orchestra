import VtsDetailedOption from '@core/components/select/VtsDetailedOption.vue'
import UiDropdown from '@core/components/ui/dropdown/UiDropdown.vue'
import type { IconName } from '@core/icons'
import { useFormSelect } from '@core/packages/form-select'
import { type SelectColumnConfig, useSelectColumn } from '@core/tables/column-definitions/select-column.ts'
import { createGlobalTestConfig } from '@core-test/create-global-test-config.ts'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'

const OPTIONS: { label: string; icon: IconName; details?: string }[] = [
  { label: 'First', icon: 'fa:plus', details: 'eth0' },
  { label: 'Second', icon: 'fa:minus' },
]

async function mountOpenSelectCell(config?: SelectColumnConfig) {
  const wrapper = mount(
    defineComponent({
      setup() {
        const { id } = useFormSelect(OPTIONS, {
          option: { id: 'label', label: 'label', properties: ({ icon, details }) => ({ icon, details }) },
        })
        const { renderBody } = useSelectColumn(config)

        return () => h('table', h('tbody', h('tr', renderBody(id))))
      },
    }),
    { global: createGlobalTestConfig() }
  )

  await flushPromises()
  await wrapper.get('.ui-input').trigger('click')
  await flushPromises()

  return wrapper
}

describe('useSelectColumn', () => {
  it('renders the options by their label without an option icon', async () => {
    const wrapper = await mountOpenSelectCell()

    expect(wrapper.findAllComponents(VtsDetailedOption)).toEqual([])
    expect(wrapper.findAllComponents(UiDropdown).map(dropdown => dropdown.text())).toEqual(['First', 'Second'])
  })

  it('shows the same icon before every option', async () => {
    const wrapper = await mountOpenSelectCell({ optionIcon: 'object:network' })

    expect(wrapper.findAllComponents(VtsDetailedOption).map(option => option.props('icon'))).toEqual([
      'object:network',
      'object:network',
    ])
  })

  it('shows the icon each option is given by the option icon function', async () => {
    const wrapper = await mountOpenSelectCell({ optionIcon: option => option.properties.icon })

    expect(wrapper.findAllComponents(VtsDetailedOption).map(option => option.props('icon'))).toEqual([
      'fa:plus',
      'fa:minus',
    ])
  })

  it('shows an option without icon when the option icon function gives none', async () => {
    const wrapper = await mountOpenSelectCell({ optionIcon: () => undefined })

    expect(wrapper.findAllComponents(VtsDetailedOption).map(option => option.props('icon'))).toEqual([
      undefined,
      undefined,
    ])
    expect(wrapper.findAllComponents(UiDropdown).map(dropdown => dropdown.text())).toEqual(['First eth0', 'Second'])
  })

  it('shows the details an option is given after its label', async () => {
    const wrapper = await mountOpenSelectCell({ optionIcon: 'object:network' })

    expect(wrapper.findAllComponents(VtsDetailedOption).map(option => option.props('details'))).toEqual([
      'eth0',
      undefined,
    ])
  })

  it('selects the option clicked among the options shown with an icon', async () => {
    const wrapper = await mountOpenSelectCell({ optionIcon: 'object:network' })

    await wrapper.findAllComponents(UiDropdown)[1].trigger('click')

    expect(wrapper.get('.vts-select .ui-input').text()).toBe('Second')
  })
})
