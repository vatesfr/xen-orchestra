import VtsDetailedOption from '@core/components/select/VtsDetailedOption.vue'
import type { IconName } from '@core/icons'
import { useFormSelect } from '@core/packages/form-select'
import { type SelectColumnConfig, useSelectColumn } from '@core/tables/column-definitions/select-column.ts'
import { mountWithSetup } from '@core-test/mount-with-setup.ts'
import { findSelectOptionLabels, findShownSelections, openSelect, pickSelectOption } from '@core-test/select.ts'
import { h } from 'vue'

const OPTIONS: { label: string; icon: IconName; details?: string }[] = [
  { label: 'First', icon: 'fa:plus', details: 'eth0' },
  { label: 'Second', icon: 'fa:minus' },
]

async function mountOpenSelectCell(config?: SelectColumnConfig) {
  const wrapper = mountWithSetup(() => {
    const { id } = useFormSelect(OPTIONS, {
      option: { id: 'label', label: 'label', properties: ({ icon, details }) => ({ icon, details }) },
    })
    const { renderBody } = useSelectColumn(config)

    return () => h('table', h('tbody', h('tr', renderBody(id))))
  })

  await openSelect(wrapper)

  return wrapper
}

describe('useSelectColumn', () => {
  it('renders the options by their label without an option icon', async () => {
    const wrapper = await mountOpenSelectCell()

    expect(wrapper.findAllComponents(VtsDetailedOption)).toEqual([])
    expect(findSelectOptionLabels(wrapper)).toEqual(['First', 'Second'])
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
    expect(findSelectOptionLabels(wrapper)).toEqual(['First eth0', 'Second'])
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

    await pickSelectOption(wrapper, 'Second')

    expect(findShownSelections(wrapper)).toEqual(['Second'])
  })
})
