import VmsCpuUsage from '@/modules/pool/components/dashboard/cpu-usage/VmsCpuUsage.vue'
import type { XoPoolDashboard } from '@/modules/pool/types/xo-pool-dashboard.type.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'

type VmCpuUsage = NonNullable<NonNullable<XoPoolDashboard['vms']>['topFiveUsage']>['cpu'][number]

function createVmCpuUsage(overrides: Partial<VmCpuUsage> = {}): VmCpuUsage {
  return {
    id: 'vm-1' as VmCpuUsage['id'],
    name_label: 'VM 1',
    percent: 25,
    ...overrides,
  }
}

function mountCpuUsage(props: { topFiveCpu?: VmCpuUsage[]; hasError?: boolean } = {}) {
  return mount(VmsCpuUsage, {
    props: { topFiveCpu: undefined, ...props },
    global: createGlobalTestConfig(),
  })
}

function findLegends(wrapper: ReturnType<typeof mountCpuUsage>) {
  return wrapper
    .findAll('.ui-legend')
    .map(legend => [legend.get('.label').text(), legend.get('.value-and-unit').text()])
}

it('reports that there is nothing to show while the usage has not arrived yet', () => {
  const wrapper = mountCpuUsage()

  expect(wrapper.get('.vts-state-hero').text()).toBe(t('no-data-to-calculate'))
})

it('shows an error message when the usage could not be fetched', () => {
  const wrapper = mountCpuUsage({ topFiveCpu: [createVmCpuUsage()], hasError: true })

  expect(wrapper.get('.vts-state-hero').text()).toBe(t('error-no-data'))
})

it('shows one progress bar per VM, the busiest first', () => {
  const wrapper = mountCpuUsage({
    topFiveCpu: [
      createVmCpuUsage({ id: 'vm-1' as VmCpuUsage['id'], name_label: 'VM 1', percent: 30 }),
      createVmCpuUsage({ id: 'vm-2' as VmCpuUsage['id'], name_label: 'VM 2', percent: 70 }),
    ],
  })

  expect(findLegends(wrapper)).toEqual([
    ['VM 2', '70%'],
    ['VM 1', '30%'],
  ])
})

it('shows an empty progress bar group for a pool without VM', () => {
  const wrapper = mountCpuUsage({ topFiveCpu: [] })

  expect(wrapper.findAll('.ui-progress-bar')).toEqual([])
  expect(wrapper.find('.vts-state-hero').exists()).toBe(false)
})
