import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import type { IconName } from '@core/icons'
import { t } from '@core-test/i18n.ts'
import { mountSelect, renderSelect } from '@core-test/mount-with-select.ts'
import { mountWithSetup } from '@core-test/mount-with-setup.ts'
import { readForwardedFlag } from '@core-test/read-forwarded-flag.ts'
import { findSelectOptionLabels, findShownSelections, openSelect } from '@core-test/select.ts'
import type { VueWrapper } from '@vue/test-utils'
import { h, ref } from 'vue'

const SUCCESS_ICON: IconName = 'status:success-circle'

const CHEVRON_ICON: IconName = 'fa:angle-down'

function findTriggerIconNames(wrapper: VueWrapper) {
  return wrapper
    .getComponent(UiInput)
    .findAllComponents(VtsIcon)
    .map(icon => icon.props('name'))
}

it.each(['neutral', 'success', 'warning', 'danger'] as const)('applies the %s accent to the trigger', accent => {
  const wrapper = mountSelect({ accent })

  expect(wrapper.getComponent(VtsSelect).classes()).toContain(`accent--${accent}`)
  expect(wrapper.getComponent(UiInput).props('accent')).toBe(accent)
})

it('shows the success icon before the chevron with the success accent', () => {
  expect(findTriggerIconNames(mountSelect({ accent: 'success' }))).toEqual([SUCCESS_ICON, CHEVRON_ICON])
})

it('shows the success icon with a success message from its wrapper', () => {
  const wrapper = mountSelect({ message: { content: 'Valid', accent: 'success' } })

  expect(findTriggerIconNames(wrapper)).toEqual([SUCCESS_ICON, CHEVRON_ICON])
})

it.each([
  { label: 'the neutral accent', options: { accent: 'neutral' } },
  { label: 'the warning accent', options: { accent: 'warning' } },
  { label: 'the danger accent', options: { accent: 'danger' } },
  { label: 'disabled', options: { accent: 'success', config: { disabled: true } } },
] as const)('shows the chevron alone with $label', ({ options }) => {
  expect(findTriggerIconNames(mountSelect(options))).toEqual([CHEVRON_ICON])
})

it.each(['disabled', 'required'] as const)('forwards the %s state to the trigger', state => {
  expect(readForwardedFlag(config => mountSelect({ config }), UiInput, state)).toEqual([true, false])
})

it('renders a readonly trigger', () => {
  expect(mountSelect().getComponent(UiInput).props('readonly')).toBe(true)
})

it('shows the label of the selected option', () => {
  const wrapper = mountSelect({ sources: ['First', 'Second'], config: { model: ref('Second') } })

  expect(findShownSelections(wrapper)).toEqual(['Second'])
})

it('shows the placeholder without selection', () => {
  const wrapper = mountSelect({ config: { placeholder: 'Choose an option' } })

  expect(wrapper.getComponent(UiInput).text()).toBe('Choose an option')
})

it('renders no option while closed', () => {
  expect(findSelectOptionLabels(mountSelect())).toEqual([])
})

it('renders the options once open', async () => {
  const wrapper = mountSelect({ sources: ['First', 'Second'] })

  await openSelect(wrapper)

  expect(findSelectOptionLabels(wrapper)).toEqual(['First', 'Second'])
})

it('renders each option through the default slot', async () => {
  const wrapper = mountSelect({
    sources: ['First', 'Second'],
    option: option => h('span', { class: 'custom-option' }, option.properties.label),
  })

  await openSelect(wrapper)

  expect(wrapper.findAll('.custom-option').map(option => option.text())).toEqual(['First', 'Second'])
})

it.each([
  { label: 'a loading message alone', sources: [], loading: true, expected: [t('loading')] },
  {
    label: 'a loading message before the options',
    sources: ['First'],
    loading: true,
    expected: [t('loading'), 'First'],
  },
  { label: 'a no result message without option', sources: [], loading: false, expected: [t('no-result')] },
])('renders $label', async ({ sources, loading, expected }) => {
  const wrapper = mountSelect({ sources, config: { loading } })

  await openSelect(wrapper)

  expect(findSelectOptionLabels(wrapper)).toEqual(expected)
})

it('renders a search input with its placeholder when searchable', async () => {
  const wrapper = mountSelect({ config: { searchable: true, searchPlaceholder: 'Search' } })

  await openSelect(wrapper)

  expect(wrapper.get('.dropdown-list input').attributes('placeholder')).toBe('Search')
})

it('renders no search input when not searchable', async () => {
  const wrapper = mountSelect()

  await openSelect(wrapper)

  expect(wrapper.find('.dropdown-list input').exists()).toBe(false)
})

it('throws when no select is defined for its id', () => {
  expect(() => mountWithSetup(() => () => renderSelect(Symbol('unknown')))).toThrow()
})

it('exposes focus', () => {
  let focusSelect = () => {}
  const wrapper = mountSelect({
    selectRef: select => {
      focusSelect = select.focus
    },
  })

  focusSelect()

  expect(document.activeElement).toBe(wrapper.getComponent(UiInput).get('input').element)
})
