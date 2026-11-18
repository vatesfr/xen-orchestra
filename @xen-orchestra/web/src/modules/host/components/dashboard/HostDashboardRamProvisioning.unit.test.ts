import HostDashboardRamProvisioning from '@/modules/host/components/dashboard/HostDashboardRamProvisioning.vue'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { createHost } from '@/test/create-host.ts'
import { findCardNumbers, findLegends, findProgressBarFillStyle } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { itShowsHostDashboardCard } from '@/test/host-dashboard-card.ts'
import { t } from '@/test/i18n.ts'
import { xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { mockModule } from '@/test/spy-on-module.ts'
import { mount } from '@vue/test-utils'

mockModule(
  import('@/modules/host/remote-resources/use-xo-host-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

beforeEach(() => {
  xoCollectionsMock.reset()
})

function mountProvisioning(host: FrontXoHost = createHost({ memory: { size: 4294967296, usage: 1073741824 } })) {
  return mount(HostDashboardRamProvisioning, {
    props: { host },
    global: createGlobalTestConfig(),
  })
}

itShowsHostDashboardCard(mountProvisioning, {
  title: t('ram-provisioning'),
  loading: { collections: ['hosts'], content: 'the provisioning', find: findCardNumbers },
})

it('splits the memory of the host between what is assigned and what is left', () => {
  const wrapper = mountProvisioning()

  expect(findCardNumbers(wrapper)).toEqual([
    [t('total-assigned'), '1 GiB'],
    [t('total-free'), '3 GiB'],
  ])
})

it('fills the progress bar with the share of the memory in use', () => {
  const wrapper = mountProvisioning()

  expect(findProgressBarFillStyle(wrapper)).toBe('width: 25%;')
})

it('labels the progress bar with the name of the host', () => {
  const wrapper = mountProvisioning(
    createHost({ name_label: 'Primary Host', memory: { size: 4294967296, usage: 1073741824 } })
  )

  expect(findLegends(wrapper).map(([label]) => label)).toEqual(['Primary Host'])
})
