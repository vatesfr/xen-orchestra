import HostLink from '@/modules/host/components/HostLink.vue'
import type { FrontXoHost, useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { createHost } from '@/test/create-host.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { objectIcon } from '@core/icons'
import { HOST_POWER_STATE } from '@vates/types'
import { mount } from '@vue/test-utils'

const { isMasterHost } = vi.hoisted(() => ({
  isMasterHost: vi.fn(),
}))

vi.mock(import('@/modules/host/remote-resources/use-xo-host-collection.ts'), () => ({
  useXoHostCollection: (() => ({ isMasterHost })) as unknown as typeof useXoHostCollection,
}))

beforeEach(() => {
  isMasterHost.mockReset()

  isMasterHost.mockReturnValue(false)
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

  expect(wrapper.text()).toBe('Primary Host')
  expect(wrapper.get('.ui-link').attributes('href')).toBe('/host/host-1/dashboard')
})

it('renders the slot content in place of the host name label', () => {
  const wrapper = mountHostLink(createHost({ name_label: 'Primary Host' }), { default: 'Custom label' })

  expect(wrapper.text()).toBe('Custom label')
})

it('picks the running icon for a running host', () => {
  const host = createHost({ power_state: HOST_POWER_STATE.RUNNING, enabled: true })

  expect(mountHostLink(host).getComponent(UiLink).props('icon')).toBe(objectIcon('host', 'running'))
})

it('picks the disabled icon for a running host that is not enabled', () => {
  const host = createHost({ power_state: HOST_POWER_STATE.RUNNING, enabled: false })

  expect(mountHostLink(host).getComponent(UiLink).props('icon')).toBe(objectIcon('host', 'disabled'))
})

it('picks the halted icon for a halted host', () => {
  const host = createHost({ power_state: HOST_POWER_STATE.HALTED })

  expect(mountHostLink(host).getComponent(UiLink).props('icon')).toBe(objectIcon('host', 'halted'))
})

it('flags the host as primary when it leads its pool', () => {
  isMasterHost.mockReturnValue(true)

  const link = mountHostLink().getComponent(UiLink)

  expect(link.props('isPrimary')).toBe(true)
  expect(link.props('primaryTooltip')).toBe(t('master'))
})

it('does not flag the host as primary when it does not lead its pool', () => {
  expect(mountHostLink().getComponent(UiLink).props('isPrimary')).toBe(false)
})
