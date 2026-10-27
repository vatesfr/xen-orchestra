import type { useVdfInterfaces, VdfInterface } from '@/modules/vdf/composables/vdf-interfaces.composable.ts'
import { useVdfLockingIssues } from '@/modules/vdf/composables/vdf-locking-issues.composable.ts'
import type { VdfHostState, VdfHostStatusDocument } from '@/modules/vdf/types.ts'
import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createVm } from '@/test/create-vm.ts'
import { mountComposable } from '@/test/mount-composable.ts'

// vdf#41: the pool overview lists VDF locks not enforced apart, an older
// agent's included (it counts them among its unlocked VIFs)

const { interfaces } = vi.hoisted(() => ({ interfaces: { value: new Map<string, VdfInterface[]>() } }))

vi.mock(import('@/modules/vdf/composables/vdf-interfaces.composable.ts'), () => ({
  useVdfInterfaces: (() => ({
    interfacesOf: (vm: FrontXoVm) => interfaces.value.get(vm.id) ?? [],
    groupInterfaces: (vm: FrontXoVm) => interfaces.value.get(vm.id) ?? [],
  })) as unknown as typeof useVdfInterfaces,
}))

const iface = (vifId: string, lock: VdfInterface['lock'], reason?: VdfInterface['lockReason']): VdfInterface => ({
  vif: { id: vifId, device: '0', lockingMode: 'network_default', other_config: {} } as unknown as FrontXoVif,
  network: undefined,
  netTags: [],
  ips: [],
  lock,
  lockReason: reason,
  untrusted: lock === 'unlocked' || lock === 'vdf-unenforced',
  unprotected: false,
})

it("lists an older agent's VDF-locked VIFs as not enforced, not as unlocked", () => {
  const app = createVm({
    id: 'vm-app' as FrontXoVm['id'],
    name_label: 'app',
    $container: 'h1' as FrontXoVm['$container'],
  })
  const web = createVm({
    id: 'vm-web' as FrontXoVm['id'],
    name_label: 'web',
    $container: 'h1' as FrontXoVm['$container'],
  })
  interfaces.value = new Map([
    ['vm-app', [iface('vif-app', 'vdf-unenforced', 'old-agent')]],
    ['vm-web', [iface('vif-web', 'unlocked')]],
  ])
  const agentVif = (vm: string, vif: string) => ({ vm, vmName: vm, vif, device: '0', network: 'n' })
  // an older agent: both VIFs are unlocked to it
  const status: VdfHostStatusDocument = {
    locking: { unlocked: 2, unlockedVifs: [agentVif('app', 'vif-app'), agentVif('web', 'vif-web')], stale: 0 },
  }
  const hosts = [{ host: { id: 'h1' }, status, state: 'up-to-date' as VdfHostState }]

  const { wrapper } = mountComposable(() =>
    useVdfLockingIssues({
      hosts,
      hostOf: () => hosts[0],
      runningVms: [app, web],
      document: { groups: { all: { tags: ['x'] } }, policies: [] },
    })
  )

  expect(wrapper.vm.vdfUnenforced.map(issue => issue.vifId)).toEqual(['vif-app'])
  expect(wrapper.vm.unlocked.map(issue => issue.vifId)).toEqual(['vif-web'])
  expect(wrapper.vm.unlockedCount).toBe(1)
})
