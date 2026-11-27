import VtsProgressBarGroupWithStates from '@core/components/progress-bar-group-with-states/VtsProgressBarGroupWithStates.vue'
import { cpuProgressThresholds } from '@core/utils/progress.util.ts'
import { createGlobalTestConfig } from '@core-test/create-global-test-config.ts'
import { findStateHeroTypes } from '@core-test/find-state-hero-types.ts'
import { t } from '@core-test/i18n.ts'
import { mount } from '@vue/test-utils'

// Found by name: its generic `<script>` would type it as a plain element
const PROGRESS_BAR_GROUP = { name: 'VtsProgressBarGroup' }

const ITEMS = [{ id: 'item-1', label: 'Item 1', current: 40, total: 100 }]

const THRESHOLDS = cpuProgressThresholds()

function mountGroup(props: { items?: typeof ITEMS; busy?: boolean; hasError?: boolean } = {}) {
  return mount(VtsProgressBarGroupWithStates, {
    global: createGlobalTestConfig(),
    props: { items: ITEMS, legendType: 'percent', thresholds: THRESHOLDS, ...props },
    slots: { default: '<p class="footer">Footer</p>' },
  })
}

it('renders the progress bars of the items, then its slot', () => {
  const wrapper = mountGroup()

  expect(wrapper.getComponent(PROGRESS_BAR_GROUP).props()).toMatchObject({
    items: ITEMS,
    legendType: 'percent',
    thresholds: THRESHOLDS,
  })
  expect(wrapper.get('.footer').text()).toBe('Footer')
  expect(findStateHeroTypes(wrapper)).toEqual([])
})

it.each([
  {
    label: 'a busy state while busy',
    props: { busy: true, hasError: true, items: [] },
    hero: { type: 'busy', text: '' },
  },
  {
    label: 'the error when the data could not be fetched',
    props: { hasError: true, items: [] },
    hero: { type: 'error', text: t('error-no-data') },
  },
  {
    label: 'that there is no data without item',
    props: { items: [] },
    hero: { type: 'no-data', text: t('no-data-to-calculate') },
  },
])('shows $label, in place of the bars and the slot', ({ props, hero }) => {
  const wrapper = mountGroup(props)

  expect(findStateHeroTypes(wrapper)).toEqual([hero.type])
  expect(wrapper.text()).toBe(hero.text)
  expect(wrapper.findComponent(PROGRESS_BAR_GROUP).exists()).toBe(false)
  expect(wrapper.find('.footer').exists()).toBe(false)
})
