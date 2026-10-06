import HostsCpuUsage from '@/modules/pool/components/dashboard/cpu-usage/HostsCpuUsage.vue'
import type { XoPoolDashboard } from '@/modules/pool/types/xo-pool-dashboard.type.ts'
import { findLegends } from '@/test/find-labelled-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'

type HostCpuUsage = NonNullable<NonNullable<XoPoolDashboard['hosts']>['topFiveUsage']>['cpu'][number]

function createHostCpuUsage(overrides: Partial<HostCpuUsage> = {}): HostCpuUsage {
  return {
    id: 'host-1' as HostCpuUsage['id'],
    name_label: 'Host 1',
    percent: 25,
    ...overrides,
  }
}

function mountCpuUsage(props: { topFiveCpu?: HostCpuUsage[]; hasError?: boolean } = {}) {
  return mount(HostsCpuUsage, {
    props: { topFiveCpu: undefined, ...props },
    global: createGlobalTestConfig(),
  })
}

it('reports that there is nothing to show while the usage has not arrived yet', () => {
  const wrapper = mountCpuUsage()

  expect(wrapper.get('.vts-state-hero').text()).toBe(t('no-data-to-calculate'))
})

it('shows an error message when the usage could not be fetched', () => {
  const wrapper = mountCpuUsage({ topFiveCpu: [createHostCpuUsage()], hasError: true })

  expect(wrapper.get('.vts-state-hero').text()).toBe(t('error-no-data'))
})

it('shows one progress bar per host, the busiest first', () => {
  const wrapper = mountCpuUsage({
    topFiveCpu: [
      createHostCpuUsage({ id: 'host-1' as HostCpuUsage['id'], name_label: 'Host 1', percent: 30 }),
      createHostCpuUsage({ id: 'host-2' as HostCpuUsage['id'], name_label: 'Host 2', percent: 70 }),
    ],
  })

  expect(findLegends(wrapper)).toEqual([
    ['Host 2', '70%'],
    ['Host 1', '30%'],
  ])
})

it('reads each share of usage out of a hundred', () => {
  const wrapper = mountCpuUsage({ topFiveCpu: [createHostCpuUsage({ percent: 12.5 })] })

  expect(findLegends(wrapper)).toEqual([['Host 1', '12.5%']])
})

it('shows an empty progress bar group for a pool without host', () => {
  const wrapper = mountCpuUsage({ topFiveCpu: [] })

  expect(wrapper.findAll('.ui-progress-bar')).toEqual([])
  expect(wrapper.find('.vts-state-hero').exists()).toBe(false)
})
