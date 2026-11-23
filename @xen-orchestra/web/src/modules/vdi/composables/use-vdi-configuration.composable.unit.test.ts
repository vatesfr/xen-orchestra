import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import { useVdiConfiguration } from '@/modules/vdi/composables/use-vdi-configuration.composable.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVdiSnapshot } from '@/modules/vdi/remote-resources/use-xo-vdi-snapshot-collection.ts'
import { createSr } from '@/test/create-sr.ts'
import { createVbd } from '@/test/create-vbd.ts'
import { createVdiSnapshot } from '@/test/create-vdi-snapshot.ts'
import { createVdi } from '@/test/create-vdi.ts'
import { mockVdiConfigurationCollections, seedVdiVms } from '@/test/mock-vdi-configuration-collections.ts'
import { xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { ref } from 'vue'

mockVdiConfigurationCollections()

function mountConfiguration(vdi?: FrontXoVdi | FrontXoVdiSnapshot, vbd?: FrontXoVbd) {
  return mountComposable(() => useVdiConfiguration(vdi, vbd)).wrapper.vm
}

describe('sr', () => {
  beforeEach(() => {
    xoCollectionsMock.srs.value = [
      createSr({ id: 'sr-a' as FrontXoSr['id'], name_label: 'Local storage' }),
      createSr({ id: 'sr-b' as FrontXoSr['id'], name_label: 'NFS storage' }),
    ]
  })

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
    const [webServerVbd, , backupProxyVbd] = seedVdiVms('Web server', 'Database', 'Backup proxy')

    const result = mountConfiguration(createVdi({ $VBDs: [webServerVbd, backupProxyVbd] }))

    expect(result.vms.map(vm => vm.name_label)).toEqual(['Web server', 'Backup proxy'])
  })

  it('is empty when the VDI has no VBD', () => {
    seedVdiVms('Web server')

    expect(mountConfiguration(createVdi({ $VBDs: [] })).vms).toEqual([])
  })

  it('is empty without a VDI', () => {
    seedVdiVms('Web server')

    expect(mountConfiguration().vms).toEqual([])
  })

  it('follows the VBDs of the source VDI', () => {
    const [webServerVbd, databaseVbd] = seedVdiVms('Web server', 'Database')
    const vdi = ref(createVdi({ $VBDs: [webServerVbd] }))
    const { wrapper } = mountComposable(() => useVdiConfiguration(vdi, undefined))

    expect(wrapper.vm.vms.map(vm => vm.name_label)).toEqual(['Web server'])

    vdi.value = createVdi({ $VBDs: [databaseVbd] })

    expect(wrapper.vm.vms.map(vm => vm.name_label)).toEqual(['Database'])
  })
})

describe('vmNames', () => {
  it('joins the names of the VMs with a comma', () => {
    const result = mountConfiguration(createVdi({ $VBDs: seedVdiVms('Web server', 'Database') }))

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

describe.each([
  {
    flag: 'isReadOnly',
    source: 'the read-only flag of the VBD',
    mountWithFlag: (value: boolean) => mountConfiguration(createVdi(), createVbd({ read_only: value })),
  },
  {
    flag: 'isBootable',
    source: 'the bootable flag of the VBD',
    mountWithFlag: (value: boolean) => mountConfiguration(createVdi(), createVbd({ bootable: value })),
  },
  {
    flag: 'isCbtEnabled',
    source: 'whether change block tracking is enabled on the VDI',
    mountWithFlag: (value: boolean) => mountConfiguration(createVdi({ cbt_enabled: value })),
  },
] as const)('$flag', ({ flag, source, mountWithFlag }) => {
  it.each([true, false])(`reflects ${source} — %s`, value => {
    expect(mountWithFlag(value)[flag]).toBe(value)
  })

  it('is false without the VDI and the VBD', () => {
    expect(mountConfiguration()[flag]).toBe(false)
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
