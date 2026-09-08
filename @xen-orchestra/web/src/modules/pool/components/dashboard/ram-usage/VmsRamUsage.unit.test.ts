import VmsRamUsage from '@/modules/pool/components/dashboard/ram-usage/VmsRamUsage.vue'
import type { XoPoolDashboard } from '@/modules/pool/types/xo-pool-dashboard.type.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'

type VmRamUsage = NonNullable<NonNullable<XoPoolDashboard['vms']>['topFiveUsage']>['ram'][number]

function createVmRamUsage(overrides: Partial<VmRamUsage> = {}): VmRamUsage {
  return {
    id: 'vm-1' as VmRamUsage['id'],
    name_label: 'VM 1',
    percent: 25,
    memory: 4294967296,
    memoryFree: 3221225472,
    ...overrides,
  }
}

function mountRamUsage(props: { topFiveRam?: VmRamUsage[]; hasError?: boolean } = {}) {
  return mount(VmsRamUsage, {
    props: { topFiveRam: undefined, ...props },
    global: createGlobalTestConfig(),
  })
}

function findLegends(wrapper: ReturnType<typeof mountRamUsage>) {
  return wrapper
    .findAll('.ui-legend')
    .map(legend => [legend.get('.label').text(), legend.get('.value-and-unit').text()])
}

it('reports that there is nothing to show while the usage has not arrived yet', () => {
  const wrapper = mountRamUsage()

  expect(wrapper.get('.vts-state-hero').text()).toBe(t('no-data-to-calculate'))
})

it('shows an error message when the usage could not be fetched', () => {
  const wrapper = mountRamUsage({ topFiveRam: [createVmRamUsage()], hasError: true })

  expect(wrapper.get('.vts-state-hero').text()).toBe(t('error-no-data'))
})

it('shows the memory each VM uses out of the memory it holds, the fullest first', () => {
  const wrapper = mountRamUsage({
    topFiveRam: [
      createVmRamUsage({
        id: 'vm-1' as VmRamUsage['id'],
        name_label: 'VM 1',
        memory: 4294967296,
        memoryFree: 3221225472,
      }),
      createVmRamUsage({
        id: 'vm-2' as VmRamUsage['id'],
        name_label: 'VM 2',
        memory: 4294967296,
        memoryFree: 1073741824,
      }),
    ],
  })

  expect(findLegends(wrapper)).toEqual([
    ['VM 2', '3 GiB / 4 GiB'],
    ['VM 1', '1 GiB / 4 GiB'],
  ])
})

it('shows an empty progress bar group for a pool without VM', () => {
  const wrapper = mountRamUsage({ topFiveRam: [] })

  expect(wrapper.findAll('.ui-progress-bar')).toEqual([])
  expect(wrapper.find('.vts-state-hero').exists()).toBe(false)
})
