import type { IconName } from '@core/icons'
import { useFormSelect } from '@core/packages/form-select'
import { type SelectColumnConfig, useSelectColumn } from '@core/tables/column-definitions/select-column.ts'
import { mountWithSetup } from '@core-test/mount-with-setup.ts'
import {
  findDetailedOptions,
  findSelectOptionLabels,
  findShownSelections,
  openSelect,
  pickSelectOption,
} from '@core-test/select.ts'
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

    expect(findDetailedOptions(wrapper)).toEqual([])
    expect(findSelectOptionLabels(wrapper)).toEqual(['First', 'Second'])
  })

  it.each([
    {
      label: 'shows the same icon before every option',
      optionIcon: 'object:network',
      icons: ['object:network', 'object:network'],
    },
    {
      label: 'shows the icon each option is given by the option icon function',
      optionIcon: option => option.properties.icon,
      icons: ['fa:plus', 'fa:minus'],
    },
    {
      label: 'shows an option without icon when the option icon function gives none',
      optionIcon: () => undefined,
      icons: [undefined, undefined],
    },
  ] satisfies { label: string; optionIcon: SelectColumnConfig['optionIcon']; icons: (IconName | undefined)[] }[])(
    '$label, with the details an option is given after its label',
    async ({ optionIcon, icons }) => {
      const wrapper = await mountOpenSelectCell({ optionIcon })

      expect(findDetailedOptions(wrapper)).toEqual([
        { label: 'First', icon: icons[0], iconTooltip: undefined, details: 'eth0' },
        { label: 'Second', icon: icons[1], iconTooltip: undefined, details: undefined },
      ])
    }
  )

  it('selects the option clicked among the options shown with an icon', async () => {
    const wrapper = await mountOpenSelectCell({ optionIcon: 'object:network' })

    await pickSelectOption(wrapper, 'Second')

    expect(findShownSelections(wrapper)).toEqual(['Second'])
  })
})
