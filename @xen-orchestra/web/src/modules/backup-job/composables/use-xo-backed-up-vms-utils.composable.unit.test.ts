import { useXoBackedUpVmsUtils } from '@/modules/backup-job/composables/use-xo-backed-up-vms-utils.composable.ts'
import type { FrontXoVmBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import type { FrontXoPool, useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createPool } from '@/test/create-pool.ts'
import { createVm } from '@/test/create-vm.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { ref } from 'vue'

const { vms, pools } = vi.hoisted(() => ({
  vms: [] as FrontXoVm[],
  pools: [] as FrontXoPool[],
}))

vi.mock(import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'), async () => {
  const { ref: vueRef } = await import('vue')

  return {
    useXoVmCollection: (() => ({
      vms: vueRef(vms),
      getVmsByIds: (ids: FrontXoVm['id'][]) => vms.filter(vm => ids.includes(vm.id)),
    })) as unknown as typeof useXoVmCollection,
  }
})

vi.mock(import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'), () => ({
  useXoPoolCollection: (() => ({
    getPoolsByIds: (ids: FrontXoPool['id'][] = []) => pools.filter(pool => ids.includes(pool.id)),
  })) as unknown as typeof useXoPoolCollection,
}))

const firstPool = createPool({ id: 'pool-1' as FrontXoPool['id'], name_label: 'First pool' })
const secondPool = createPool({ id: 'pool-2' as FrontXoPool['id'], name_label: 'Second pool' })

const taggedVm = createVm({ id: 'vm-1' as FrontXoVm['id'], tags: ['test'] })
const untaggedVm = createVm({ id: 'vm-2' as FrontXoVm['id'], tags: [] })
const noBakVm = createVm({ id: 'vm-3' as FrontXoVm['id'], tags: ['test', 'xo:no-bak'] })

beforeEach(() => {
  vms.splice(0, vms.length, taggedVm, untaggedVm, noBakVm)
  pools.splice(0, pools.length, firstPool, secondPool)
})

function mountBackedUpVms(backedUpVms: FrontXoVmBackupJob['vms']) {
  return mountComposable(() => useXoBackedUpVmsUtils(ref(backedUpVms))).wrapper.vm
}

describe('useXoBackedUpVmsUtils', () => {
  describe('VMs picked by hand', () => {
    it('lists the picked VMs, without smart mode', () => {
      const result = mountBackedUpVms({ id: { __or: [taggedVm.id, untaggedVm.id] } })

      expect(result.isSmartModeEnabled).toBe(false)
      expect(result.backedUpVms.map(vm => vm.id)).toEqual([taggedVm.id, untaggedVm.id])
      expect(result.backedUpVmsCount).toBe(2)
      expect(result.smartModeTags).toBeUndefined()
      expect(result.smartModePools).toBeUndefined()
      expect(result.smartModePowerState).toBeUndefined()
    })
  })

  describe('smart mode', () => {
    it('lists the VMs matching the smart mode, except the ones tagged xo:no-bak', () => {
      const result = mountBackedUpVms({ type: 'VM', tags: { __or: [['test']] } })

      expect(result.isSmartModeEnabled).toBe(true)
      expect(result.backedUpVms.map(vm => vm.id)).toEqual([taggedVm.id])
    })

    it('reads the included and excluded tags, always excluding xo:no-bak', () => {
      const result = mountBackedUpVms({
        type: 'VM',
        tags: { __and: [{ __or: [['test']] }, { __not: { __or: [['skip']] } }] },
      })

      expect(result.smartModeTags).toEqual({ included: ['test'], excluded: ['skip', 'xo:no-bak'] })
    })

    it('excludes only xo:no-bak when no tag is excluded', () => {
      const result = mountBackedUpVms({ type: 'VM', tags: { __or: [['test']] } })

      expect(result.smartModeTags).toEqual({ included: ['test'], excluded: ['xo:no-bak'] })
    })

    it('reads the pools the VMs must and must not be resident on', () => {
      const result = mountBackedUpVms({
        type: 'VM',
        $pool: { __and: [{ __or: [firstPool.id] }, { __not: { __or: [secondPool.id] } }] },
      })

      expect(result.smartModePools).toEqual({ included: [firstPool], excluded: [secondPool] })
    })

    it('reads the power state of the VMs', () => {
      expect(mountBackedUpVms({ type: 'VM', power_state: 'Running' }).smartModePowerState).toBe('Running')
    })
  })
})
