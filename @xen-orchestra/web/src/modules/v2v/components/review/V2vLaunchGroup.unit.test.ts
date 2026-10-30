import V2vLaunchGroup from '@/modules/v2v/components/review/V2vLaunchGroup.vue'
import { findCardTitleLabel } from '@/test/find-card-title.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import { mount } from '@vue/test-utils'

const HEADING = { label: 'Excluded', accent: 'danger' } as const

function mountGroup(count: number) {
  return mount(V2vLaunchGroup, {
    props: { heading: HEADING, count },
    slots: { default: '<p class="vms">mail-01</p>' },
    global: createGlobalTestConfig(),
  })
}

it('titles the group with its label', () => {
  expect(findCardTitleLabel(mountGroup(2))).toContain(HEADING.label)
})

it('counts its VMs with the accent of the group', () => {
  expect(mountGroup(2).getComponent(UiCounter).props()).toMatchObject({ value: 2, accent: 'danger' })
})

it('shows its VMs', () => {
  expect(mountGroup(2).get('.vms').text()).toBe('mail-01')
})

it('is hidden without VM', () => {
  expect(mountGroup(0).findComponent(UiCard).exists()).toBe(false)
})
