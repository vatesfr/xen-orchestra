import V2vListLockSummary from '@/modules/v2v/components/selected-vms/V2vListLockSummary.vue'
import V2vSelectedVmItem from '@/modules/v2v/components/selected-vms/V2vSelectedVmItem.vue'
import V2vSelectedVmsPanel from '@/modules/v2v/components/selected-vms/V2vSelectedVmsPanel.vue'
import type { V2vAccentedLabel } from '@/modules/v2v/composables/use-v2v-vm-labels.composable.ts'
import { createV2vListLock, createV2vSelectedVm } from '@/test/create-v2v-selected-vms.ts'
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

const ITEMS = [
  createV2vSelectedVm({ id: 'vm-1' as XoV2vVm['id'], name: 'web-01' }),
  createV2vSelectedVm({ id: 'vm-2' as XoV2vVm['id'], name: 'db-01' }),
]

const READINESS_TAGS: V2vAccentedLabel<TagAccent>[] = [
  { label: '1 ready', accent: 'success' },
  { label: '1 blocking', accent: 'danger' },
]

const LOCK_SUMMARY = createV2vListLock()

const EMPTY = {
  items: [],
  count: 0,
  isEmpty: true,
  readinessTags: [],
  lockSummary: createV2vListLock({ isLocked: false }),
}

function mountPanel(props: Partial<ComponentProps<typeof V2vSelectedVmsPanel>> = {}) {
  return mount(V2vSelectedVmsPanel, {
    props: {
      items: ITEMS,
      count: ITEMS.length,
      isEmpty: false,
      isBusy: false,
      readinessTags: READINESS_TAGS,
      lockSummary: LOCK_SUMMARY,
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
  // Its VMs are no selection to clear: it only closes to leave the full screen of a small screen
  it('is the persistent side panel of the page', () => {
    expect(mountPanel().getComponent(VtsSidePanel).props('persistent')).toBe(true)
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

  it('summarizes the lock of the list', () => {
    expect(getSummaryCard(mountPanel()).getComponent(V2vListLockSummary).props()).toEqual(LOCK_SUMMARY)
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

  it('still titles the selected VMs with their count and summarizes the lock of the list', () => {
    const wrapper = mountPanel({ isBusy: true })

    expect(getSummaryCard(wrapper).getComponent(UiCounter).text()).toBe('2')
    expect(getSummaryCard(wrapper).getComponent(V2vListLockSummary).props()).toEqual(LOCK_SUMMARY)
  })

  it('tells an empty list empty, rows loading or not', () => {
    const wrapper = mountPanel({ ...EMPTY, isBusy: true })

    expect(wrapper.getComponent(VtsStateHero).text()).toContain(t('v2v:no-vm-in-list'))
  })
})

describe('empty', () => {
  it('tells the list has no VM, never asking for a selection', () => {
    const wrapper = mountPanel(EMPTY)

    expect(findStateHeroTypes(wrapper)).toEqual(['no-data'])
    expect(wrapper.getComponent(VtsStateHero).text()).toContain(t('v2v:no-vm-in-list'))
    expect(wrapper.findAllComponents(V2vSelectedVmItem)).toEqual([])
  })

  it('offers no clear', () => {
    expect(findButton(mountPanel(EMPTY), t('action:clear'))).toBeUndefined()
  })

  it('has no readiness tag', () => {
    expect(findAccentedTags(getSummaryCard(mountPanel(EMPTY)))).toEqual([])
  })

  it('still summarizes the lock of the list', () => {
    expect(getSummaryCard(mountPanel(EMPTY)).getComponent(V2vListLockSummary).props()).toEqual(EMPTY.lockSummary)
  })
})
