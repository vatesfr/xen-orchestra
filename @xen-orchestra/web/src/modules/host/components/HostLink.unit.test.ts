import HostLink from '@/modules/host/components/HostLink.vue'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { createHost } from '@/test/create-host.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { xoCollectionsMock, mockXoCollections } from '@/test/mock-xo-collections.ts'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { objectIcon } from '@core/icons'
import { findLink } from '@core-test/find-links.ts'
import { HOST_POWER_STATE } from '@vates/types'
import { mount } from '@vue/test-utils'

mockXoCollections('host')

beforeEach(() => {
  xoCollectionsMock.reset()
})

function mountHostLink(host: FrontXoHost = createHost(), slots?: { default: string }) {
  return mount(HostLink, {
    props: { host, size: 'small' },
    slots,
    global: createGlobalTestConfig(),
  })
}

it('shows the host name label and links to its dashboard', () => {
  const host = createHost({ id: 'host-1' as FrontXoHost['id'], name_label: 'Primary Host' })

  const wrapper = mountHostLink(host)

  expect(findLink(wrapper)).toMatchObject({ text: 'Primary Host', href: '/host/host-1/dashboard' })
})

it('links to the given route in place of the dashboard', () => {
  const host = createHost({ id: 'host-1' as FrontXoHost['id'] })

  const wrapper = mount(HostLink, {
    props: { host, size: 'small', to: { name: '/host/[id]/networks', params: { id: host.id } } },
    global: createGlobalTestConfig(),
  })

  expect(findLink(wrapper)?.href).toBe('/host/host-1/networks')
})

it('renders the slot content in place of the host name label', () => {
  const wrapper = mountHostLink(createHost({ name_label: 'Primary Host' }), { default: 'Custom label' })

  expect(wrapper.text()).toBe('Custom label')
})

it.each([
  { label: 'a running host', host: { power_state: HOST_POWER_STATE.RUNNING, enabled: true }, state: 'running' },
  {
    label: 'a running host that is not enabled',
    host: { power_state: HOST_POWER_STATE.RUNNING, enabled: false },
    state: 'disabled',
  },
  { label: 'a halted host', host: { power_state: HOST_POWER_STATE.HALTED }, state: 'halted' },
] as const)('picks the $state icon for $label', ({ host, state }) => {
  expect(findLink(mountHostLink(createHost(host)))?.icon).toBe(objectIcon('host', state))
})

it('flags the host as primary when it leads its pool', () => {
  xoCollectionsMock.seedMasterHost(createHost())

  const link = mountHostLink().getComponent(UiLink)

  expect(link.props('isPrimary')).toBe(true)
  expect(link.props('primaryTooltip')).toBe(t('master'))
})

it('does not flag the host as primary when it does not lead its pool', () => {
  expect(mountHostLink().getComponent(UiLink).props('isPrimary')).toBe(false)
})
