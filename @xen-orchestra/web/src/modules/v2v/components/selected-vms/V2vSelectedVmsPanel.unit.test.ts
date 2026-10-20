import V2vListLockSummary from '@/modules/v2v/components/selected-vms/V2vListLockSummary.vue'
import V2vSelectedVmItem from '@/modules/v2v/components/selected-vms/V2vSelectedVmItem.vue'
import V2vSelectedVmsPanel from '@/modules/v2v/components/selected-vms/V2vSelectedVmsPanel.vue'
import type { V2vVmTag } from '@/modules/v2v/composables/use-v2v-vm-labels.composable.ts'
import { createV2vListLock, createV2vSelectedVmItem } from '@/test/create-v2v-selected-vms.ts'
import { findAccentedTags } from '@/test/find-accented-tags.ts'
import { findParts } from '@/test/find-parts.ts'
import { findButton, getButton } from '@/test/get-button.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import type { XoV2vVm } from '@vates/types'
import { mount } from '@vue/test-utils'

const ITEMS = [
  createV2vSelectedVmItem({ id: 'vm-1' as XoV2vVm['id'], name: 'web-01' }),
  createV2vSelectedVmItem({ id: 'vm-2' as XoV2vVm['id'], name: 'db-01' }),
]

const READINESS_TAGS: V2vVmTag[] = [
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

function mountPanel(props: Partial<InstanceType<typeof V2vSelectedVmsPanel>['$props']> = {}) {
  return mount(V2vSelectedVmsPanel, {
    props: {
      items: ITEMS,
      count: ITEMS.length,
      isEmpty: false,
      readinessTags: READINESS_TAGS,
      lockSummary: LOCK_SUMMARY,
      isOpen: true,
      ...props,
    },
    global: createGlobalTestConfig(),
  })
}

describe('open', () => {
  it('titles the selected VMs with their count', () => {
    const title = mountPanel().getComponent(UiPanelCardTitle)

    expect(title.props('label')).toBe(t('selected-vms'))
    expect(title.getComponent(UiCounter).text()).toBe('2')
  })

  it('tells where the list is kept', () => {
    expect(findParts(mountPanel(), '.storage-info')).toEqual([
      t('v2v:saved-in-this-browser'),
      t('v2v:sent-to-xo-at-launch'),
    ])
  })

  it('summarizes the lock of the list', () => {
    expect(mountPanel().getComponent(V2vListLockSummary).props()).toEqual(LOCK_SUMMARY)
  })

  it('tags the readiness of the VMs', () => {
    expect(findAccentedTags(mountPanel().get('.readiness'))).toEqual(READINESS_TAGS)
  })

  it('shows one item per VM, in order', () => {
    const items = mountPanel().findAllComponents(V2vSelectedVmItem)

    expect(items.map(item => item.props('item'))).toEqual(ITEMS)
  })

  it('removes the VM of an item', () => {
    const wrapper = mountPanel()

    wrapper.findAllComponents(V2vSelectedVmItem)[1].vm.$emit('remove', ITEMS[1].id)

    expect(wrapper.emitted('remove')).toEqual([[ITEMS[1].id]])
  })

  it('clears the list', async () => {
    const wrapper = mountPanel()

    await getButton(wrapper, t('action:clear')).trigger('click')

    expect(wrapper.emitted('clear')).toEqual([[]])
  })

  it('hides itself', async () => {
    const wrapper = mountPanel()

    await getButton(wrapper, t('action:hide')).trigger('click')

    expect(wrapper.emitted('toggle')).toEqual([[]])
  })

  it('has no empty state', () => {
    expect(mountPanel().findComponent(VtsStateHero).exists()).toBe(false)
  })
})

describe('empty', () => {
  it('tells the list has no VM', () => {
    const wrapper = mountPanel(EMPTY)

    expect(wrapper.getComponent(VtsStateHero).text()).toContain(t('v2v:no-vm-in-list'))
    expect(wrapper.findAllComponents(V2vSelectedVmItem)).toEqual([])
  })

  it('offers no clear', () => {
    expect(findButton(mountPanel(EMPTY), t('action:clear'))).toBeUndefined()
  })

  it('has no readiness tag', () => {
    expect(mountPanel(EMPTY).find('.readiness').exists()).toBe(false)
  })

  it('still summarizes the lock of the list', () => {
    expect(mountPanel(EMPTY).getComponent(V2vListLockSummary).props()).toEqual(EMPTY.lockSummary)
  })
})

describe('hidden', () => {
  it('only offers to show the selected VMs, with their count', () => {
    const wrapper = mountPanel({ isOpen: false })

    expect(wrapper.text()).toBe(t('selected-vms-n', { n: 2 }))
    expect(wrapper.findComponent(V2vSelectedVmItem).exists()).toBe(false)
  })

  it('shows itself', async () => {
    const wrapper = mountPanel({ isOpen: false })

    await getButton(wrapper, t('selected-vms-n', { n: 2 })).trigger('click')

    expect(wrapper.emitted('toggle')).toEqual([[]])
  })
})
