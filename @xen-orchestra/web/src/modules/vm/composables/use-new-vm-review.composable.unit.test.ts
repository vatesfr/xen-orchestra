import { useNewVmReview } from '@/modules/vm/composables/use-new-vm-review.composable.ts'
import type { InstallMode } from '@/modules/vm/types/new-xo-vm.type.ts'
import { createVmTemplate } from '@/test/create-vm-template.ts'
import {
  chooseNewVmTemplate,
  mountComposableUnderNewVmForm,
  NEW_VM_AUTOMATIC_NETWORK,
  NEW_VM_DISK_TEMPLATE,
  NEW_VM_HOST,
  NEW_VM_ISO,
  NEW_VM_ISO_SR_NAME,
  NEW_VM_TEMPLATE_VDI,
  NEW_VM_TEMPLATE_VIF,
  resetNewVmCollections,
  seedNewVmCollections,
} from '@/test/new-vm-fixtures.ts'
import { nextTick } from 'vue'
import { useI18n } from 'vue-i18n'

vi.mock(
  import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

vi.mock(
  import('@/modules/host/remote-resources/use-xo-host-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

vi.mock(
  import('@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

vi.mock(
  import('@/modules/network/remote-resources/use-xo-network-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

vi.mock(
  import('@/modules/pif/remote-resources/use-xo-pif-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

vi.mock(
  import('@/modules/vm/remote-resources/use-xo-vm-template-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

vi.mock(
  import('@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'),
  () => import('@/test/mock-xo-vm-device-collections.ts')
)

vi.mock(
  import('@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'),
  () => import('@/test/mock-xo-vm-device-collections.ts')
)

vi.mock(
  import('@/modules/vdi/remote-resources/use-xo-vdi-snapshot-collection.ts'),
  () => import('@/test/mock-xo-vm-device-collections.ts')
)

vi.mock(
  import('@/modules/vif/remote-resources/use-xo-vif-collection.ts'),
  () => import('@/test/mock-xo-vm-device-collections.ts')
)

const GIB = 1024 ** 3

// A template describing a disk to create, without any disk of its own
const TEMPLATE_WITH_DISK_TO_CREATE = createVmTemplate({
  template_info: { disks: [{ bootable: true, size: 8 * GIB, SR: '', type: 'system' }], install_methods: [] },
})

beforeEach(() => {
  resetNewVmCollections()
})

async function mountReview(template = NEW_VM_DISK_TEMPLATE) {
  seedNewVmCollections()

  const { form, vm } = mountComposableUnderNewVmForm(() => ({ ...useNewVmReview(), t: useI18n().t }))

  await chooseNewVmTemplate(form, template)

  return { form, review: vm }
}

describe('installSourceLabel', () => {
  it.each<[NonNullable<InstallMode>, string]>([
    ['no-config', 'no-config'],
    ['ssh-key', 'ssh-key'],
    ['cloud-init-config', 'cloud-init-config'],
    ['network', 'pxe'],
    ['cdrom', 'iso-dvd'],
  ])('names the "%s" installation source', async (installMode, key) => {
    const { form, review } = await mountReview()

    form.vmState.installMode = installMode

    expect(review.installSourceLabel).toBe(review.t(key))
  })
})

describe('isoLabel', () => {
  it('is the chosen ISO, prefixed with the name of its SR', async () => {
    const { form, review } = await mountReview()

    form.vmState.selectedVdi = NEW_VM_ISO.id

    expect(review.isoLabel).toBe(`[${NEW_VM_ISO_SR_NAME}] ${NEW_VM_ISO.name_label}`)
  })

  it('is undefined without an ISO', async () => {
    expect((await mountReview()).review.isoLabel).toBeUndefined()
  })
})

describe('affinityHost', () => {
  it('is the chosen host', async () => {
    const { form, review } = await mountReview()

    form.vmState.affinity_host = NEW_VM_HOST.id

    expect(review.affinityHost?.name_label).toBe(NEW_VM_HOST.name_label)
  })

  it('is undefined without an affinity host', async () => {
    expect((await mountReview()).review.affinityHost).toBeUndefined()
  })
})

describe('affinityHostRoute', () => {
  it('leads to the dashboard of the chosen host', async () => {
    const { form, review } = await mountReview()

    form.vmState.affinity_host = NEW_VM_HOST.id

    expect(review.affinityHostRoute).toEqual({ name: '/host/[id]/dashboard', params: { id: NEW_VM_HOST.id } })
  })

  it('is undefined without an affinity host', async () => {
    expect((await mountReview()).review.affinityHostRoute).toBeUndefined()
  })
})

describe('bootFirmwareLabel', () => {
  it('is the firmware in upper case', async () => {
    expect((await mountReview()).review.bootFirmwareLabel).toBe('UEFI')
  })
})

describe('highAvailabilityLabel', () => {
  it('names the chosen high availability mode', async () => {
    const { form, review } = await mountReview()

    form.vmState.highAvailability = 'restart'

    expect(review.highAvailabilityLabel).toBe(review.t('new-vm:ha-restart'))
  })
})

describe('ramLabel', () => {
  it('is the memory of the VM in GB', async () => {
    const { review } = await mountReview()

    expect(review.ramLabel).toBe(review.t('n-gb', { n: 4 }))
  })
})

describe('overridden', () => {
  it('flags nothing on an untouched template', async () => {
    const { review } = await mountReview()

    expect(review.overridden).toEqual({
      bootFirmware: false,
      secureBoot: false,
      createVtpm: false,
      copyHostBiosStrings: false,
      highAvailability: false,
      vCPU: false,
      ram: false,
      bootVm: false,
      autoPoweron: false,
      clone: false,
    })
  })

  it('flags the values moved away from the template', async () => {
    const { form, review } = await mountReview()

    Object.assign(form.vmState, { vCPU: 8, ram: 16 * GIB, highAvailability: 'restart', secureBoot: true })

    expect(review.overridden).toMatchObject({ vCPU: true, ram: true, highAvailability: true, secureBoot: true })
  })

  it('flags the settings moved away from their default', async () => {
    const { form, review } = await mountReview()

    Object.assign(form.vmState, { boot_vm: false, autoPoweron: true, clone: false, createVtpm: true })

    expect(review.overridden).toMatchObject({ bootVm: true, autoPoweron: true, clone: true, createVtpm: true })
  })

  it('flags a firmware other than the one of the template', async () => {
    const { form, review } = await mountReview()

    form.vmState.bootFirmware = 'bios'
    await nextTick()

    expect(review.overridden.bootFirmware).toBe(true)
  })

  it('does not flag the BIOS strings copied because the template has some', async () => {
    const { review } = await mountReview(createVmTemplate({ bios_strings: { 'bios-vendor': 'Vendor' } }))

    expect(review.overridden.copyHostBiosStrings).toBe(false)
  })

  it('flags the BIOS strings copied by choice', async () => {
    const { form, review } = await mountReview(createVmTemplate())

    form.vmState.copyHostBiosStrings = true

    expect(review.overridden.copyHostBiosStrings).toBe(true)
  })
})

describe('vifs', () => {
  it('lists the interfaces of the template without marker', async () => {
    const { review } = await mountReview()

    expect(review.vifs).toEqual([
      {
        key: NEW_VM_TEMPLATE_VIF.id,
        rank: 1,
        network: 'Template network',
        mac: review.t('auto-generated'),
        marker: undefined,
      },
    ])
  })

  it('marks a template interface moved to another network as overridden', async () => {
    const { form, review } = await mountReview()

    form.vmState.vifs[0].network = NEW_VM_AUTOMATIC_NETWORK.id

    expect(review.vifs[0]).toMatchObject({ network: 'Automatic network', marker: 'overridden' })
  })

  it('marks an interface the user added, with its MAC address', async () => {
    const { form, review } = await mountReview()

    form.addVif()
    form.vmState.vifs[1].mac = 'aa:bb:cc:dd:ee:ff'

    expect(review.vifs[1]).toEqual({
      key: form.vmState.vifs[1].key,
      rank: 2,
      network: 'Automatic network',
      mac: 'aa:bb:cc:dd:ee:ff',
      marker: 'added',
    })
  })
})

describe('deletedVifsCount', () => {
  it('counts the template interfaces the user removed', async () => {
    const { form, review } = await mountReview()

    form.removeVif(NEW_VM_TEMPLATE_VIF.id)

    expect(review.deletedVifsCount).toBe(1)
  })

  it('is zero while every template interface is kept', async () => {
    expect((await mountReview()).review.deletedVifsCount).toBe(0)
  })
})

describe('vdis', () => {
  it('lists the disks copied from the template without marker', async () => {
    const { review } = await mountReview()

    expect(review.vdis).toEqual([
      {
        key: NEW_VM_TEMPLATE_VDI.id,
        rank: 1,
        sr: 'Pool SR',
        name: 'Template disk',
        size: 10,
        description: 'Disk of the template',
        isCopiedFromTemplate: true,
        marker: undefined,
      },
    ])
  })

  it('marks a renamed template disk as overridden', async () => {
    const { form, review } = await mountReview()

    form.vmState.existingVdis[0].name_label = 'Renamed disk'

    expect(review.vdis[0]).toMatchObject({ name: 'Renamed disk', marker: 'overridden' })
  })

  it('does not mark a template disk for a size that will not be applied', async () => {
    const { form, review } = await mountReview()

    form.vmState.existingVdis[0].size = 20

    expect(review.vdis[0].marker).toBeUndefined()
  })

  it('marks a disk the user added as a new empty disk', async () => {
    const { form, review } = await mountReview()

    form.addVdi()

    expect(review.vdis[1]).toMatchObject({ rank: 2, isCopiedFromTemplate: false, marker: 'added' })
  })

  it('lists a disk the template asks to create without marker', async () => {
    const { review } = await mountReview(TEMPLATE_WITH_DISK_TO_CREATE)

    expect(review.vdis).toMatchObject([{ size: 8, isCopiedFromTemplate: false, marker: undefined }])
  })

  it('marks a resized disk the template asks to create as overridden', async () => {
    const { form, review } = await mountReview(TEMPLATE_WITH_DISK_TO_CREATE)

    form.vmState.vdis[0].size = 16

    expect(review.vdis[0].marker).toBe('overridden')
  })
})

describe('deletedVdisCount', () => {
  it('counts the template disks the user removed', async () => {
    const { form, review } = await mountReview()

    form.removeVdi(NEW_VM_TEMPLATE_VDI.id)

    expect(review.deletedVdisCount).toBe(1)
  })

  it('counts the removed disks the template asked to create', async () => {
    const { form, review } = await mountReview(TEMPLATE_WITH_DISK_TO_CREATE)

    form.removeVdi(form.vmState.vdis[0].key)

    expect(review.deletedVdisCount).toBe(1)
  })

  it('is zero while every template disk is kept', async () => {
    expect((await mountReview()).review.deletedVdisCount).toBe(0)
  })
})
