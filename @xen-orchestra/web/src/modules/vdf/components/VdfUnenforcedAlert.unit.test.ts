import VdfUnenforcedAlert from '@/modules/vdf/components/VdfUnenforcedAlert.vue'
import type { useVdfAvailability } from '@/modules/vdf/composables/vdf-availability.composable.ts'
import type { useVdfFirewallRights } from '@/modules/vdf/composables/vdf-rights.composable.ts'
import type { useVdfUnenforced } from '@/modules/vdf/remote-resources/use-vdf-unenforced.ts'
import type { VdfUnenforced } from '@/modules/vdf/types.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'

// vdf#141: hosts whose firewall agent can't enforce while protected VMs run
// there, as the plugin lists them for the current user

const { state } = vi.hoisted(() => ({ state: { enabled: true, canRead: true } }))

vi.mock(import('@/modules/vdf/composables/vdf-availability.composable.ts'), () => ({
  useVdfAvailability: (() => ({ isVdfEnabled: ref(state.enabled) })) as unknown as typeof useVdfAvailability,
}))

vi.mock(import('@/modules/vdf/composables/vdf-rights.composable.ts'), () => ({
  useVdfFirewallRights: (() => ({
    can: (action: string) => action !== 'read' || state.canRead,
  })) as unknown as typeof useVdfFirewallRights,
}))

const UNENFORCED: VdfUnenforced = {
  pools: [
    {
      id: 'pool-1',
      name: 'prod',
      hosts: [
        {
          id: 'host-1',
          name: 'xcp1',
          state: 'missing',
          reason: 'no firewall agent on host "xcp1"',
          vms: [
            { id: 'vm-1', name: 'web-1' },
            { id: 'vm-2', name: 'db-1' },
          ],
        },
        {
          id: 'host-2',
          name: 'xcp2',
          state: 'stale',
          reason: 'the firewall agent on host "xcp2" has not reported since 2026-11-13T09:00:00.000Z',
          since: '2026-11-13T09:00:00.000Z',
          vms: [{ id: 'vm-3', name: 'app-1' }],
        },
      ],
    },
    {
      id: 'pool-2',
      name: 'lab',
      hosts: [
        {
          id: 'host-3',
          name: 'lab1',
          state: 'stopped',
          reason: 'the firewall agent on host "lab1" stopped at 2026-11-13T10:00:00.000Z',
          vms: [{ id: 'vm-4', name: 'test-1' }],
        },
      ],
    },
  ],
}

vi.mock(import('@/modules/vdf/remote-resources/use-vdf-unenforced.ts'), () => ({
  useVdfUnenforced: (() => ({ unenforced: ref(UNENFORCED) })) as unknown as typeof useVdfUnenforced,
}))

const mountAlert = (
  props: { poolId?: string; hostId?: string; vmId?: string },
  { enabled = true, canRead = true } = {}
) => {
  state.enabled = enabled
  state.canRead = canRead

  return mount(VdfUnenforcedAlert, { props, global: createGlobalTestConfig() })
}

const linkedVms = (wrapper: ReturnType<typeof mountAlert>) => wrapper.findAllComponents(UiLink).map(link => link.text())

it("XO-wide: every pool's hosts, with their pool and their VMs", () => {
  const wrapper = mountAlert({})

  expect(wrapper.text()).toContain(t('firewall:unenforced:hosts', { n: 3 }, 3))
  expect(wrapper.text()).toContain('lab: the firewall agent on host "lab1" stopped')
  expect(linkedVms(wrapper)).toEqual(['web-1', 'db-1', 'app-1', 'test-1'])
})

it("a pool's: its hosts only", () => {
  const wrapper = mountAlert({ poolId: 'pool-1' })

  expect(wrapper.text()).toContain(t('firewall:unenforced:hosts', { n: 2 }, 2))
  expect(wrapper.text()).toContain('no firewall agent on host "xcp1"')
  expect(wrapper.text()).not.toContain('lab1')
  expect(linkedVms(wrapper)).toEqual(['web-1', 'db-1', 'app-1'])
})

it("a host's: its VMs", () => {
  const wrapper = mountAlert({ poolId: 'pool-1', hostId: 'host-1' })

  expect(wrapper.text()).toContain(t('firewall:unenforced:host', { n: 2 }, 2))
  expect(wrapper.text()).not.toContain('xcp2')
  expect(linkedVms(wrapper)).toEqual(['web-1', 'db-1'])
})

it("a VM's: the host it runs on, no links", () => {
  const wrapper = mountAlert({ poolId: 'pool-1', vmId: 'vm-3' })

  expect(wrapper.text()).toContain(t('firewall:unenforced:vm', { host: 'xcp2' }))
  expect(wrapper.text()).toContain('has not reported since')
  expect(linkedVms(wrapper)).toEqual([])
})

it('nothing for a VM, a host or a pool that is fine', () => {
  expect(mountAlert({ poolId: 'pool-1', vmId: 'vm-9' }).text()).toBe('')
  expect(mountAlert({ poolId: 'pool-1', hostId: 'host-9' }).text()).toBe('')
  expect(mountAlert({ poolId: 'pool-9' }).text()).toBe('')
})

it('nothing without the firewall read right on the pool, or without the plugin', () => {
  expect(mountAlert({ poolId: 'pool-1' }, { canRead: false }).text()).toBe('')
  expect(mountAlert({}, { enabled: false }).text()).toBe('')
})
