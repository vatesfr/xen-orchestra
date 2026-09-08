import HostsRamUsage from '@/modules/pool/components/dashboard/ram-usage/HostsRamUsage.vue'
import type { XoPoolDashboard } from '@/modules/pool/types/xo-pool-dashboard.type.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'

type HostRamUsage = NonNullable<NonNullable<XoPoolDashboard['hosts']>['topFiveUsage']>['ram'][number]

function createHostRamUsage(overrides: Partial<HostRamUsage> = {}): HostRamUsage {
  return {
    id: 'host-1' as HostRamUsage['id'],
    name_label: 'Host 1',
    percent: 25,
    size: 4294967296,
    usage: 1073741824,
    ...overrides,
  }
}

function mountRamUsage(props: { topFiveRam?: HostRamUsage[]; hasError?: boolean } = {}) {
  return mount(HostsRamUsage, {
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
  const wrapper = mountRamUsage({ topFiveRam: [createHostRamUsage()], hasError: true })

  expect(wrapper.get('.vts-state-hero').text()).toBe(t('error-no-data'))
})

it('shows the memory each host uses out of the memory it holds, the fullest first', () => {
  const wrapper = mountRamUsage({
    topFiveRam: [
      createHostRamUsage({
        id: 'host-1' as HostRamUsage['id'],
        name_label: 'Host 1',
        usage: 1073741824,
        size: 4294967296,
      }),
      createHostRamUsage({
        id: 'host-2' as HostRamUsage['id'],
        name_label: 'Host 2',
        usage: 3221225472,
        size: 4294967296,
      }),
    ],
  })

  expect(findLegends(wrapper)).toEqual([
    ['Host 2', '3 GiB / 4 GiB'],
    ['Host 1', '1 GiB / 4 GiB'],
  ])
})

it('shows an empty progress bar group for a pool without host', () => {
  const wrapper = mountRamUsage({ topFiveRam: [] })

  expect(wrapper.findAll('.ui-progress-bar')).toEqual([])
  expect(wrapper.find('.vts-state-hero').exists()).toBe(false)
})

it('follows the usage as new stats arrive', async () => {
  const wrapper = mountRamUsage({ topFiveRam: [createHostRamUsage({ usage: 1073741824, size: 4294967296 })] })

  await wrapper.setProps({ topFiveRam: [createHostRamUsage({ usage: 3221225472, size: 4294967296 })] })

  expect(findLegends(wrapper)).toEqual([['Host 1', '3 GiB / 4 GiB']])
})
