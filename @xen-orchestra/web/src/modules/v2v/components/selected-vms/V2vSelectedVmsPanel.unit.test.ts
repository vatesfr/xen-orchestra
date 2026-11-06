import V2vListPairSummary from '@/modules/v2v/components/selected-vms/V2vListPairSummary.vue'
import V2vSelectedVmItem from '@/modules/v2v/components/selected-vms/V2vSelectedVmItem.vue'
import V2vSelectedVmsPanel from '@/modules/v2v/components/selected-vms/V2vSelectedVmsPanel.vue'
import type { V2vAccentedLabel } from '@/modules/v2v/composables/use-v2v-vm-labels.composable.ts'
import { createV2vListPair, createV2vSelectedVm } from '@/test/create-v2v-selected-vms.ts'
import { findAccentedTags } from '@/test/find-accented-labels.ts'
import { findParts } from '@/test/find-parts.ts'
import { findButton, getButton } from '@/test/get-button.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import type { TagAccent } from '@core/components/ui/tag/UiTag.vue'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import type { XoV2vVm } from '@vates/types'
import { mount, type VueWrapper } from '@vue/test-utils'
import type { ComponentProps } from 'vue-component-type-helpers'

const ITEMS = [createV2vSelectedVm(), createV2vSelectedVm({ id: 'vm-2' as XoV2vVm['id'], name: 'db-01' })]

const READINESS_TAGS: V2vAccentedLabel<TagAccent>[] = [
  { label: '1 ready', accent: 'success' },
  { label: '1 blocking', accent: 'danger' },
]

const LIST_PAIR = createV2vListPair()

const EMPTY = {
  items: [],
  count: 0,
  isEmpty: true,
  readinessTags: [],
  listPair: createV2vListPair(),
}

function mountPanel(props: Partial<ComponentProps<typeof V2vSelectedVmsPanel>> = {}) {
  return mount(V2vSelectedVmsPanel, {
    props: {
      items: ITEMS,
      count: ITEMS.length,
      isEmpty: false,
      isBusy: false,
      readinessTags: READINESS_TAGS,
      listPair: LIST_PAIR,
      ...props,
    },
    global: createGlobalTestConfig(),
  })
}

// The actions of a side panel sit in its header, above its cards
function getHeaderClearButton(wrapper: VueWrapper) {
  return getButton(wrapper.getComponent(VtsSidePanel).get('.ui-panel > .header'), t('action:clear'))
}

function getSummaryCard(wrapper: VueWrapper) {
  return wrapper.getComponent(UiPanelCard)
}

function findStateHeroTypes(wrapper: VueWrapper) {
  return wrapper.findAllComponents(VtsStateHero).map(stateHero => stateHero.props('type'))
}

describe('with VMs', () => {
  // Its VMs open it like a selection, but are none to clear: it only closes where closing collapses it
  it('is the persistent side panel of the page, holding its VMs as a selection', () => {
    expect(mountPanel().getComponent(VtsSidePanel).props()).toMatchObject({ hasSelection: true, persistent: true })
  })

  it('titles its summary card with the selected VMs and their count', () => {
    const title = getSummaryCard(mountPanel()).getComponent(UiPanelCardTitle)

    expect(title.props('label')).toBe(t('selected-vms'))
    expect(title.getComponent(UiCounter).text()).toBe('2')
  })

  it('tells where the list is kept', () => {
    expect(findParts(getSummaryCard(mountPanel()), '.storage-info')).toEqual([
      t('v2v:saved-in-this-browser'),
      t('v2v:sent-to-xo-at-launch'),
    ])
  })

  it('summarizes the source and pool of the list', () => {
    expect(getSummaryCard(mountPanel()).getComponent(V2vListPairSummary).props()).toEqual(LIST_PAIR)
  })

  it('tags the readiness of the VMs', () => {
    expect(findAccentedTags(getSummaryCard(mountPanel()))).toEqual(READINESS_TAGS)
  })

  it('shows one card per VM after the summary, in order', () => {
    const wrapper = mountPanel()
    const items = wrapper.findAllComponents(V2vSelectedVmItem)

    expect(items.map(item => item.props('item'))).toEqual(ITEMS)
    expect(wrapper.findAllComponents(UiPanelCard)).toHaveLength(1 + ITEMS.length)
  })

  it('removes the VM of an item', () => {
    const wrapper = mountPanel()

    wrapper.findAllComponents(V2vSelectedVmItem)[1].vm.$emit('remove', ITEMS[1].id)

    expect(wrapper.emitted('remove')).toEqual([[ITEMS[1].id]])
  })

  it('clears the list from its actions', async () => {
    const wrapper = mountPanel()

    await getHeaderClearButton(wrapper).trigger('click')

    expect(wrapper.emitted('clear')).toEqual([[]])
  })

  it('has no state hero', () => {
    expect(findStateHeroTypes(mountPanel())).toEqual([])
  })
})

describe('busy', () => {
  it('shows the loading state instead of the VMs, their readiness and the clear', () => {
    const wrapper = mountPanel({ isBusy: true })

    expect(findStateHeroTypes(wrapper)).toEqual(['busy'])
    expect(wrapper.findAllComponents(V2vSelectedVmItem)).toEqual([])
    expect(findAccentedTags(getSummaryCard(wrapper))).toEqual([])
    expect(findButton(wrapper, t('action:clear'))).toBeUndefined()
  })

  it('still titles the selected VMs with their count and summarizes the source and pool of the list', () => {
    const wrapper = mountPanel({ isBusy: true })

    expect(getSummaryCard(wrapper).getComponent(UiCounter).text()).toBe('2')
    expect(getSummaryCard(wrapper).getComponent(V2vListPairSummary).props()).toEqual(LIST_PAIR)
  })
})

describe('empty', () => {
  it('holds no selection', () => {
    expect(mountPanel(EMPTY).getComponent(VtsSidePanel).props('hasSelection')).toBe(false)
  })

  it('offers no clear', () => {
    expect(findButton(mountPanel(EMPTY), t('action:clear'))).toBeUndefined()
  })
})
