import type { FrontXoHost, useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import VdfVmInterface from '@/modules/vdf/components/vm/VdfVmInterface.vue'
import type { VdfHostLocking } from '@/modules/vdf/types.ts'
import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import { createHost } from '@/test/create-host.ts'
import { createVm } from '@/test/create-vm.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { VM_POWER_STATE } from '@vates/types'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'

// vdf#41: each interface says how it's locked, a VDF lock as its host's
// agent enforces it

const { hosts } = vi.hoisted(() => ({ hosts: { value: [] as FrontXoHost[] } }))

vi.mock(import('@/modules/host/remote-resources/use-xo-host-collection.ts'), () => ({
  useXoHostCollection: (() => ({ hosts: ref(hosts.value) })) as unknown as typeof useXoHostCollection,
}))

const SUPPORTING: VdfHostLocking = { unlocked: 0, stale: 0, vdfLock: true, vdfLocked: 1, vdfUnenforced: [] }

// the VM's host, whose agent wrote this status (now, unless `heartbeat`)
function withHost(locking: VdfHostLocking | undefined, heartbeat = new Date().toISOString()) {
  hosts.value = [
    createHost({
      name_label: 'host-a',
      otherConfig: { 'vdf:status': JSON.stringify({ heartbeat, heartbeatSec: 30, locking }) },
    }),
  ]
}

function vif(fields: Partial<FrontXoVif> = {}): FrontXoVif {
  return {
    id: 'vif-1',
    $VM: 'vm-123',
    $network: 'net-1',
    device: '0',
    lockingMode: 'network_default',
    allowedIpv4Addresses: ['192.168.1.100'],
    allowedIpv6Addresses: [],
    MAC: '8e:f1:9f:5d:4e:94',
    other_config: { 'vdf:locking': 'locked' },
    ...fields,
  } as unknown as FrontXoVif
}

function shown(lockVif: FrontXoVif, vm = createVm()) {
  const wrapper = mount(VdfVmInterface, {
    props: { vif: lockVif, vm, network: undefined },
    global: createGlobalTestConfig(),
  })

  return wrapper.get('.locking').text()
}

beforeEach(() => withHost(SUPPORTING))

it('Locked (XAPI)', () => {
  expect(shown(vif({ lockingMode: 'locked', other_config: {} }))).toContain(t('firewall:vm:locking:xapi'))
})

it('Locked by VDF, with its unlock action', () => {
  const text = shown(vif())

  expect(text).toContain(t('firewall:vm:locking:vdf'))
  expect(text).toContain(t('firewall:unlock:action'))
})

it('Locked by VDF, not enforced: the agent stopped, older, or says so', () => {
  withHost(SUPPORTING, new Date(Date.now() - 120e3).toISOString())
  expect(shown(vif())).toContain(t('firewall:vm:locking:vdf-unenforced:agent', { host: 'host-a' }))

  withHost({ unlocked: 1, stale: 0 })
  expect(shown(vif())).toContain(t('firewall:vm:locking:vdf-unenforced:old-agent', { host: 'host-a' }))

  withHost({ ...SUPPORTING, vdfUnenforced: ['vif-1'] })
  expect(shown(vif())).toContain(t('firewall:vm:locking:vdf-unenforced:reported', { host: 'host-a' }))
})

it('Unlocked, with its lock action', () => {
  const text = shown(vif({ other_config: {} }))

  expect(text).toContain(t('firewall:vm:locking:unlocked'))
  expect(text).toContain(t('firewall:lock:action'))
})

it("a halted VM's VDF lock applies where it starts", () => {
  hosts.value = []
  expect(shown(vif(), createVm({ power_state: VM_POWER_STATE.HALTED }))).toContain(t('firewall:vm:locking:vdf'))
})

it('a lock asked for says how it is locked now and whether VDF could lock it', async () => {
  withHost({ unlocked: 1, stale: 0 })

  const wrapper = mount(VdfVmInterface, {
    props: { vif: vif({ other_config: {} }), vm: createVm(), network: undefined },
    global: createGlobalTestConfig(),
  })

  await wrapper.get('.locking button').trigger('click')

  expect(wrapper.emitted('lock')?.[0]?.[0]).toMatchObject({
    vifId: 'vif-1',
    lock: 'unlocked',
    vdfUnavailable: 'old-agent',
    hostName: 'host-a',
  })
})
