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

// Resolve ids against fixtures the way the real collections do, so the test asserts
// which records the composable asks for rather than echoing a canned return value
function givenCollections({
  srs = [],
  vbds = [],
  vms = [],
}: {
  srs?: FrontXoSr[]
  vbds?: FrontXoVbd[]
  vms?: FrontXoVm[]
}) {
  useGetSrById.mockImplementation((id: MaybeRefOrGetter<FrontXoSr['id'] | undefined>) =>
    computed(() => srs.find(sr => sr.id === toValue(id)))
  )
  useGetVbdsByIds.mockImplementation((ids: MaybeRefOrGetter<FrontXoVbd['id'][]>) =>
    computed(() => vbds.filter(vbd => toValue(ids).includes(vbd.id)))
  )
  useGetVmsByIds.mockImplementation((ids: MaybeRefOrGetter<FrontXoVm['id'][]>) =>
    computed(() => vms.filter(vm => toValue(ids).includes(vm.id)))
  )
}

function mountVdiConfiguration(vdi: FrontXoVdi | undefined, vbd?: FrontXoVbd) {
  return mountComposable(() => useVdiConfiguration(vdi, vbd)).wrapper.vm
}

beforeEach(() => {
  useGetSrById.mockReset()
  useGetVbdsByIds.mockReset()
  useGetVmsByIds.mockReset()

  givenCollections({})
})

describe('sr', () => {
  it('resolves the SR the VDI lives on', () => {
    const vdiSr = createSr({ id: 'sr-2' as FrontXoSr['id'], name_label: 'Fast SR' })
    givenCollections({ srs: [createSr({ id: 'sr-1' as FrontXoSr['id'] }), vdiSr] })

    const result = mountVdiConfiguration(createVdi({ $SR: vdiSr.id }))

    expect(result.sr?.name_label).toBe('Fast SR')
  })

  it('is undefined without a VDI', () => {
    givenCollections({ srs: [createSr()] })

    expect(mountVdiConfiguration(undefined).sr).toBeUndefined()
  })
})

describe('vms', () => {
  it('lists the VMs the VDI is plugged into through its VBDs', () => {
    givenCollections({
      vbds: [
        createVbd({ id: 'vbd-1' as FrontXoVbd['id'], VM: 'vm-1' as FrontXoVbd['VM'] }),
        createVbd({ id: 'vbd-2' as FrontXoVbd['id'], VM: 'vm-2' as FrontXoVbd['VM'] }),
        createVbd({ id: 'vbd-3' as FrontXoVbd['id'], VM: 'vm-3' as FrontXoVbd['VM'] }),
      ],
      vms: [
        createVm({ id: 'vm-1' as FrontXoVm['id'], name_label: 'Web server' }),
        createVm({ id: 'vm-2' as FrontXoVm['id'], name_label: 'Database' }),
        createVm({ id: 'vm-3' as FrontXoVm['id'], name_label: 'Unrelated' }),
      ],
    })

    const result = mountVdiConfiguration(createVdi({ $VBDs: ['vbd-1', 'vbd-2'] as FrontXoVdi['$VBDs'] }))

    expect(result.vms.map(vm => vm.name_label)).toEqual(['Web server', 'Database'])
  })

  it('leaves out a VBD whose VM the VM collection does not resolve', () => {
    givenCollections({
      vbds: [createVbd({ id: 'vbd-1' as FrontXoVbd['id'], VM: 'template-1' as FrontXoVbd['VM'] })],
      vms: [createVm()],
    })

    const result = mountVdiConfiguration(createVdi({ $VBDs: ['vbd-1'] as FrontXoVdi['$VBDs'] }))

    expect(result.vms).toEqual([])
  })

  it('is empty for a VDI with no VBD', () => {
    givenCollections({ vbds: [createVbd()], vms: [createVm()] })

    expect(mountVdiConfiguration(createVdi({ $VBDs: [] })).vms).toEqual([])
  })

  it('is empty without a VDI', () => {
    givenCollections({ vbds: [createVbd()], vms: [createVm()] })

    expect(mountVdiConfiguration(undefined).vms).toEqual([])
  })

  it('follows the VDI when it changes', () => {
    givenCollections({
      vbds: [
        createVbd({ id: 'vbd-1' as FrontXoVbd['id'], VM: 'vm-1' as FrontXoVbd['VM'] }),
        createVbd({ id: 'vbd-2' as FrontXoVbd['id'], VM: 'vm-2' as FrontXoVbd['VM'] }),
      ],
      vms: [
        createVm({ id: 'vm-1' as FrontXoVm['id'], name_label: 'Web server' }),
        createVm({ id: 'vm-2' as FrontXoVm['id'], name_label: 'Database' }),
      ],
    })

    const vdi = ref(createVdi({ $VBDs: ['vbd-1'] as FrontXoVdi['$VBDs'] }))
    const { wrapper } = mountComposable(() => useVdiConfiguration(vdi, undefined))

    expect(wrapper.vm.vms.map(vm => vm.name_label)).toEqual(['Web server'])

    vdi.value = createVdi({ $VBDs: ['vbd-2'] as FrontXoVdi['$VBDs'] })

    expect(wrapper.vm.vms.map(vm => vm.name_label)).toEqual(['Database'])
  })
})

describe('format', () => {
  it('shows the image format of the VDI in uppercase', () => {
    expect(mountVdiConfiguration(createVdi({ image_format: 'qcow2' })).format).toBe('QCOW2')
  })

  it('falls back to VHD without a VDI', () => {
    expect(mountVdiConfiguration(undefined).format).toBe('VHD')
  })
})

describe('isReadOnly', () => {
  it('is true for a read-only VBD', () => {
    expect(mountVdiConfiguration(createVdi(), createVbd({ read_only: true })).isReadOnly).toBe(true)
  })

  it('is false for a writable VBD', () => {
    expect(mountVdiConfiguration(createVdi(), createVbd({ read_only: false })).isReadOnly).toBe(false)
  })

  it('is false without a VBD', () => {
    expect(mountVdiConfiguration(createVdi()).isReadOnly).toBe(false)
  })
})

describe('isBootable', () => {
  it('is true for a bootable VBD', () => {
    expect(mountVdiConfiguration(createVdi(), createVbd({ bootable: true })).isBootable).toBe(true)
  })

  it('is false for a non-bootable VBD', () => {
    expect(mountVdiConfiguration(createVdi(), createVbd({ bootable: false })).isBootable).toBe(false)
  })

  it('is false without a VBD', () => {
    expect(mountVdiConfiguration(createVdi()).isBootable).toBe(false)
  })
})

describe('isCbtEnabled', () => {
  it('is true when change block tracking is enabled on the VDI', () => {
    expect(mountVdiConfiguration(createVdi({ cbt_enabled: true })).isCbtEnabled).toBe(true)
  })

  it('is false when change block tracking is disabled on the VDI', () => {
    expect(mountVdiConfiguration(createVdi({ cbt_enabled: false })).isCbtEnabled).toBe(false)
  })

  it('is false when the VDI does not report the flag', () => {
    expect(mountVdiConfiguration(createVdi({ cbt_enabled: undefined })).isCbtEnabled).toBe(false)
  })

  it('is false without a VDI', () => {
    expect(mountVdiConfiguration(undefined).isCbtEnabled).toBe(false)
  })
})

describe('isSnapshottingEnabled', () => {
  it('is true for a VDI without the NOSNAP tag', () => {
    expect(mountVdiConfiguration(createVdi({ tags: ['production'] })).isSnapshottingEnabled).toBe(true)
  })

  it('is false for a VDI tagged NOSNAP', () => {
    expect(mountVdiConfiguration(createVdi({ tags: ['production', 'NOSNAP'] })).isSnapshottingEnabled).toBe(false)
  })

  it('is false without a VDI', () => {
    expect(mountVdiConfiguration(undefined).isSnapshottingEnabled).toBe(false)
  })
})
