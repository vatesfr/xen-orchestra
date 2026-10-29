import type {
  FrontXoSr,
  useXoSrCollection,
} from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { FrontXoVbd, useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import { useVdiConfiguration } from '@/modules/vdi/composables/use-vdi-configuration.composable.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createSr } from '@/test/create-sr.ts'
import { createVbd } from '@/test/create-vbd.ts'
import { createVdiSnapshot } from '@/test/create-vdi-snapshot.ts'
import { createVdi } from '@/test/create-vdi.ts'
import { createVm } from '@/test/create-vm.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { computed, type MaybeRefOrGetter, ref, toValue } from 'vue'

const { useGetSrById, useGetVbdsByIds, useGetVmsByIds } = vi.hoisted(() => ({
  useGetSrById: vi.fn(),
  useGetVbdsByIds: vi.fn(),
  useGetVmsByIds: vi.fn(),
}))

vi.mock(import('@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'), () => ({
  useXoSrCollection: (() => ({ useGetSrById })) as unknown as typeof useXoSrCollection,
}))

vi.mock(import('@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'), () => ({
  useXoVbdCollection: (() => ({ useGetVbdsByIds })) as unknown as typeof useXoVbdCollection,
}))

vi.mock(import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'), () => ({
  useXoVmCollection: (() => ({ useGetVmsByIds })) as unknown as typeof useXoVmCollection,
}))

const srs = [
  createSr({ id: 'sr-a' as FrontXoSr['id'], name_label: 'Local storage' }),
  createSr({ id: 'sr-b' as FrontXoSr['id'], name_label: 'NFS storage' }),
]

const vbds = [
  createVbd({ id: 'vbd-1' as FrontXoVbd['id'], VM: 'vm-1' as FrontXoVbd['VM'] }),
  createVbd({ id: 'vbd-2' as FrontXoVbd['id'], VM: 'vm-2' as FrontXoVbd['VM'] }),
  createVbd({ id: 'vbd-3' as FrontXoVbd['id'], VM: 'vm-3' as FrontXoVbd['VM'] }),
]

const vms = [
  createVm({ id: 'vm-1' as FrontXoVm['id'], name_label: 'Web server' }),
  createVm({ id: 'vm-2' as FrontXoVm['id'], name_label: 'Database' }),
  createVm({ id: 'vm-3' as FrontXoVm['id'], name_label: 'Backup proxy' }),
]

beforeEach(() => {
  useGetSrById.mockReset()
  useGetVbdsByIds.mockReset()
  useGetVmsByIds.mockReset()

  // resolve by id over the fixtures, the way the real collections do, so the test asserts which records are looked up
  useGetSrById.mockImplementation((id: MaybeRefOrGetter<FrontXoSr['id'] | undefined>) =>
    computed(() => srs.find(sr => sr.id === toValue(id)))
  )
  useGetVbdsByIds.mockImplementation((ids: MaybeRefOrGetter<FrontXoVbd['id'][]>) =>
    computed(() => vbds.filter(vbd => toValue(ids).includes(vbd.id)))
  )
  useGetVmsByIds.mockImplementation((ids: MaybeRefOrGetter<FrontXoVm['id'][]>) =>
    computed(() => vms.filter(vm => toValue(ids).includes(vm.id)))
  )
})

function mountConfiguration(vdi?: FrontXoVdi | ReturnType<typeof createVdiSnapshot>, vbd?: FrontXoVbd) {
  return mountComposable(() => useVdiConfiguration(vdi, vbd)).wrapper.vm
}

describe('sr', () => {
  it('resolves the SR the VDI lives on', () => {
    const result = mountConfiguration(createVdi({ $SR: 'sr-b' as FrontXoVdi['$SR'] }))

    expect(result.sr?.name_label).toBe('NFS storage')
  })

  it('resolves the SR of a VDI snapshot', () => {
    const result = mountConfiguration(createVdiSnapshot({ $SR: 'sr-a' as FrontXoVdi['$SR'] }))

    expect(result.sr?.name_label).toBe('Local storage')
  })

  it('is undefined without a VDI', () => {
    expect(mountConfiguration().sr).toBeUndefined()
  })
})

describe('vms', () => {
  it('resolves the VMs the VDI is plugged into through its VBDs', () => {
    const result = mountConfiguration(createVdi({ $VBDs: ['vbd-1', 'vbd-3'] as FrontXoVdi['$VBDs'] }))

    expect(result.vms.map(vm => vm.name_label)).toEqual(['Web server', 'Backup proxy'])
  })

  it('is empty when the VDI has no VBD', () => {
    expect(mountConfiguration(createVdi({ $VBDs: [] })).vms).toEqual([])
  })

  it('is empty without a VDI', () => {
    expect(mountConfiguration().vms).toEqual([])
  })

  it('follows the VBDs of the source VDI', () => {
    const vdi = ref(createVdi({ $VBDs: ['vbd-1'] as FrontXoVdi['$VBDs'] }))
    const { wrapper } = mountComposable(() => useVdiConfiguration(vdi, undefined))

    expect(wrapper.vm.vms.map(vm => vm.name_label)).toEqual(['Web server'])

    vdi.value = createVdi({ $VBDs: ['vbd-2'] as FrontXoVdi['$VBDs'] })

    expect(wrapper.vm.vms.map(vm => vm.name_label)).toEqual(['Database'])
  })
})

describe('vmNames', () => {
  it('joins the names of the VMs with a comma', () => {
    const result = mountConfiguration(createVdi({ $VBDs: ['vbd-1', 'vbd-2'] as FrontXoVdi['$VBDs'] }))

    expect(result.vmNames).toBe('Web server, Database')
  })

  it('is empty when the VDI is plugged into no VM', () => {
    expect(mountConfiguration(createVdi({ $VBDs: [] })).vmNames).toBe('')
  })
})

describe('format', () => {
  it('upper-cases the image format of the VDI', () => {
    expect(mountConfiguration(createVdi({ image_format: 'qcow2' })).format).toBe('QCOW2')
  })

  it('falls back to VHD when the VDI has no image format', () => {
    expect(mountConfiguration(createVdi({ image_format: undefined })).format).toBe('VHD')
  })
})

describe('isReadOnly', () => {
  it('reflects the read-only flag of the VBD', () => {
    expect(mountConfiguration(createVdi(), createVbd({ read_only: true })).isReadOnly).toBe(true)
    expect(mountConfiguration(createVdi(), createVbd({ read_only: false })).isReadOnly).toBe(false)
  })

  it('is false without a VBD', () => {
    expect(mountConfiguration(createVdi()).isReadOnly).toBe(false)
  })
})

describe('isBootable', () => {
  it('reflects the bootable flag of the VBD', () => {
    expect(mountConfiguration(createVdi(), createVbd({ bootable: true })).isBootable).toBe(true)
    expect(mountConfiguration(createVdi(), createVbd({ bootable: false })).isBootable).toBe(false)
  })

  it('is false without a VBD', () => {
    expect(mountConfiguration(createVdi()).isBootable).toBe(false)
  })
})

describe('isCbtEnabled', () => {
  it('reflects whether change block tracking is enabled on the VDI', () => {
    expect(mountConfiguration(createVdi({ cbt_enabled: true })).isCbtEnabled).toBe(true)
    expect(mountConfiguration(createVdi({ cbt_enabled: false })).isCbtEnabled).toBe(false)
  })

  it('is false without a VDI', () => {
    expect(mountConfiguration().isCbtEnabled).toBe(false)
  })
})

describe('isSnapshottingEnabled', () => {
  it('is true when the VDI is not tagged NOSNAP', () => {
    expect(mountConfiguration(createVdi({ tags: ['production'] })).isSnapshottingEnabled).toBe(true)
  })

  it('is false when the VDI is tagged NOSNAP', () => {
    expect(mountConfiguration(createVdi({ tags: ['production', 'NOSNAP'] })).isSnapshottingEnabled).toBe(false)
  })

  it('is false without a VDI', () => {
    expect(mountConfiguration().isSnapshottingEnabled).toBe(false)
  })
})
