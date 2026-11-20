import type {
  FrontXoSr,
  useXoSrCollection,
} from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { FrontXoVbd, useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { FrontXoVdi, useXoVdiCollection } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { useXoVmDisksSrs } from '@/modules/vm/composables/xo-vm-disks-srs.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createSr } from '@/test/create-sr.ts'
import { createVbd } from '@/test/create-vbd.ts'
import { createVdi } from '@/test/create-vdi.ts'
import { createVm } from '@/test/create-vm.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { computed, type MaybeRefOrGetter, ref, toValue } from 'vue'

const { getVbdsByIds, useGetVdisByIds, useGetSrsByIds } = vi.hoisted(() => ({
  getVbdsByIds: vi.fn(),
  useGetVdisByIds: vi.fn(),
  useGetSrsByIds: vi.fn(),
}))

vi.mock(import('@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'), () => ({
  useXoVbdCollection: (() => ({ getVbdsByIds })) as unknown as typeof useXoVbdCollection,
}))

vi.mock(import('@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'), () => ({
  useXoVdiCollection: (() => ({ useGetVdisByIds })) as unknown as typeof useXoVdiCollection,
}))

vi.mock(import('@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'), () => ({
  useXoSrCollection: (() => ({ useGetSrsByIds })) as unknown as typeof useXoSrCollection,
}))

const localSr = createSr({ id: 'sr-local' as FrontXoSr['id'], name_label: 'Local SR' })
const nfsSr = createSr({ id: 'sr-nfs' as FrontXoSr['id'], name_label: 'Shared NFS' })
const isoSr = createSr({ id: 'sr-iso' as FrontXoSr['id'], name_label: 'ISO library' })

const systemVdi = createVdi({ id: 'vdi-system' as FrontXoVdi['id'], $SR: localSr.id })
const dataVdi = createVdi({ id: 'vdi-data' as FrontXoVdi['id'], $SR: localSr.id })
const backupVdi = createVdi({ id: 'vdi-backup' as FrontXoVdi['id'], $SR: nfsSr.id })
const isoVdi = createVdi({ id: 'vdi-iso' as FrontXoVdi['id'], $SR: isoSr.id })

const vbds = [
  createVbd({ id: 'vbd-system' as FrontXoVbd['id'], VDI: systemVdi.id as FrontXoVbd['VDI'] }),
  createVbd({ id: 'vbd-data' as FrontXoVbd['id'], VDI: dataVdi.id as FrontXoVbd['VDI'] }),
  createVbd({ id: 'vbd-backup' as FrontXoVbd['id'], VDI: backupVdi.id as FrontXoVbd['VDI'] }),
  createVbd({ id: 'vbd-cd' as FrontXoVbd['id'], VDI: isoVdi.id as FrontXoVbd['VDI'], is_cd_drive: true }),
]

beforeEach(() => {
  getVbdsByIds.mockReset()
  useGetVdisByIds.mockReset()
  useGetSrsByIds.mockReset()

  getVbdsByIds.mockImplementation((ids: FrontXoVbd['id'][]) => vbds.filter(vbd => ids.includes(vbd.id)))

  useGetVdisByIds.mockImplementation((ids: MaybeRefOrGetter<FrontXoVdi['id'][]>) =>
    computed(() => [systemVdi, dataVdi, backupVdi, isoVdi].filter(vdi => toValue(ids).includes(vdi.id)))
  )

  useGetSrsByIds.mockImplementation((ids: MaybeRefOrGetter<FrontXoSr['id'][]>) =>
    computed(() => [localSr, nfsSr, isoSr].filter(sr => toValue(ids).includes(sr.id)))
  )
})

function mountDisksSrs(vm: MaybeRefOrGetter<FrontXoVm>) {
  return mountComposable(() => useXoVmDisksSrs(vm)).wrapper.vm
}

function createVmWithVbds(vbdIds: string[]) {
  return createVm({ $VBDs: vbdIds as FrontXoVm['$VBDs'] })
}

describe('vdis', () => {
  it('returns the disks of the VM, without the ISO mounted in its CD drive', () => {
    const result = mountDisksSrs(createVmWithVbds(['vbd-system', 'vbd-backup', 'vbd-cd']))

    expect(result.vdis).toEqual([systemVdi, backupVdi])
  })

  it('reacts to changes of the source VM', () => {
    const vm = ref(createVmWithVbds(['vbd-system']))
    const result = mountDisksSrs(vm)

    expect(result.vdis).toEqual([systemVdi])

    vm.value = createVmWithVbds(['vbd-backup'])

    expect(result.vdis).toEqual([backupVdi])
  })
})

describe('srs', () => {
  it('lists each SR holding a disk of the VM once, even when it holds several disks', () => {
    const result = mountDisksSrs(createVmWithVbds(['vbd-system', 'vbd-data', 'vbd-backup']))

    expect(result.srs).toEqual([localSr, nfsSr])
  })

  it('leaves out the SR of the ISO mounted in the CD drive', () => {
    const result = mountDisksSrs(createVmWithVbds(['vbd-system', 'vbd-cd']))

    expect(result.srs).toEqual([localSr])
  })

  it('is empty when the VM has no disk', () => {
    const result = mountDisksSrs(createVmWithVbds([]))

    expect(result.srs).toEqual([])
  })

  it('reacts to changes of the source VM', () => {
    const vm = ref(createVmWithVbds(['vbd-system']))
    const result = mountDisksSrs(vm)

    expect(result.srs).toEqual([localSr])

    vm.value = createVmWithVbds(['vbd-system', 'vbd-backup'])

    expect(result.srs).toEqual([localSr, nfsSr])
  })
})
