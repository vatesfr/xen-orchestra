import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsDetailedOption from '@core/components/select/VtsDetailedOption.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import type { IconName } from '@core/icons'
import { type FormOption, useFormSelect } from '@core/packages/form-select'
import { createGlobalTestConfig } from '@core-test/create-global-test-config.ts'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h } from 'vue'

type DetailedOptionProps = {
  icon?: IconName
  iconTooltip?: string
  details?: string
}

// An option only renders inside an open select, which provides it its controller
async function mountDetailedOption(props: DetailedOptionProps = {}) {
  const wrapper = mount(
    defineComponent({
      setup() {
        const { id } = useFormSelect(['Network'])

        return () =>
          h(
            VtsSelect,
            { id, accent: 'neutral' },
            { default: ({ option }: { option: FormOption }) => h(VtsDetailedOption, { option, ...props }) }
          )
      },
    }),
    { global: createGlobalTestConfig() }
  )

  await flushPromises()
  await wrapper.get('.vts-select .ui-input').trigger('click')
  await flushPromises()

  return wrapper.getComponent(VtsDetailedOption)
}

// The dropdown of the option renders its own icon, a comment node without a name: only the one beside the label
// belongs to the detailed option
function findOptionIcons(option: Pick<VueWrapper, 'findAllComponents'>) {
  return option.findAllComponents(VtsIcon).filter(icon => {
    const element = icon.element

    if (!(element instanceof Element)) {
      return false
    }

    return element.closest('.vts-detailed-option') !== null
  })
}

it('renders the label of the option', async () => {
  const option = await mountDetailedOption()

  expect(option.get('.vts-detailed-option').text()).toBe('Network')
})

it('renders the details after the label', async () => {
  const option = await mountDetailedOption({ details: 'eth0' })

  expect(option.get('.em-dash-prefix').text()).toBe('eth0')
})

it('renders no details when none are passed', async () => {
  const option = await mountDetailedOption()

  expect(option.find('.em-dash-prefix').exists()).toBe(false)
})

it('renders the icon with its tooltip', async () => {
  const option = await mountDetailedOption({ icon: 'object:network', iconTooltip: 'Connected' })

  const icons = findOptionIcons(option)

  expect(icons.map(icon => ({ name: icon.props('name'), tooltip: icon.props('tooltip') }))).toEqual([
    { name: 'object:network', tooltip: 'Connected' },
  ])
})

it('renders no icon when none is passed', async () => {
  const option = await mountDetailedOption()

  expect(findOptionIcons(option)).toEqual([])
})
