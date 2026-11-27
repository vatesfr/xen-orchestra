import { provideNewVmForm } from '@/modules/vm/form/new/use-new-vm-form.ts'
import { createNetwork } from '@/test/create-network.ts'
import { createManagementPif, createPif } from '@/test/create-pif.ts'
import { createPool, OTHER_POOL_ID } from '@/test/create-pool.ts'
import { createSr } from '@/test/create-sr.ts'
import { createTestRouter } from '@/test/create-test-router.ts'
import { createVbd } from '@/test/create-vbd.ts'
import { createVdiSnapshot } from '@/test/create-vdi-snapshot.ts'
import { createVmTemplate } from '@/test/create-vm-template.ts'
import { xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { vmDeviceCollectionsMock } from '@/test/mock-xo-vm-device-collections.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import {
  chooseNewVmTemplate,
  mockNewVmCollections,
  NEW_VM_AUTOMATIC_NETWORK,
  NEW_VM_DISK_TEMPLATE,
  NEW_VM_DISKLESS_TEMPLATE,
  NEW_VM_HOST,
  NEW_VM_ISO,
  NEW_VM_ISO_SR_NAME,
  NEW_VM_NETWORK,
  NEW_VM_POOL,
  NEW_VM_SR,
  NEW_VM_TEMPLATE_VDI,
  NEW_VM_TEMPLATE_VIF,
  resetNewVmCollections,
  seedNewVmCollections,
} from '@/test/new-vm-fixtures.ts'
import { nextTick } from 'vue'

mockNewVmCollections()

beforeEach(() => {
  resetNewVmCollections()
})

function mountForm(options: Parameters<typeof mountComposable>[1] = {}) {
  seedNewVmCollections()

  return mountComposable(() => provideNewVmForm(), options).wrapper.vm
}

async function mountFormOnTemplate(template = NEW_VM_DISK_TEMPLATE) {
  const form = mountForm()

  await chooseNewVmTemplate(form, template)

  return form
}

describe('vmState', () => {
  it('starts on the pool the route names', async () => {
    const router = createTestRouter()
    await router.push({ path: '/vm/new', query: { poolid: NEW_VM_POOL.id } })

    expect(mountForm({ router }).vmState.pool?.id).toBe(NEW_VM_POOL.id)
  })

  it('starts without a pool when the route names none', () => {
    expect(mountForm().vmState.pool).toBeUndefined()
  })

  it('takes the values of the chosen template', async () => {
    const form = await mountFormOnTemplate()

    expect(form.vmState).toMatchObject({
      name: 'Debian 12',
      description: 'Debian template',
      vCPU: 2,
      ram: 4 * 1024 ** 3,
      bootFirmware: 'uefi',
      installMode: 'no-config',
      isDiskTemplateSelected: true,
    })
  })

  it('lists the disks and the network interfaces of the chosen template', async () => {
    const form = await mountFormOnTemplate()

    expect(form.vmState.existingVdis).toEqual([
      {
        key: NEW_VM_TEMPLATE_VDI.id,
        id: NEW_VM_TEMPLATE_VDI.id,
        name_label: 'Template disk',
        name_description: 'Disk of the template',
        size: 10,
        sr: NEW_VM_SR.id,
        userdevice: '0',
      },
    ])
    expect(form.vmState.vifs).toEqual([
      { key: NEW_VM_TEMPLATE_VIF.id, id: NEW_VM_TEMPLATE_VIF.id, network: NEW_VM_NETWORK.id, mac: '', device: '0' },
    ])
  })

  it('gives a template without network interface one on each automatic network of the pool', async () => {
    const form = mountForm()
    const otherAutomaticNetwork = createNetwork({
      id: 'network-other-automatic' as typeof NEW_VM_NETWORK.id,
      other_config: { automatic: 'true' },
    })
    xoCollectionsMock.networks.value = [NEW_VM_NETWORK, NEW_VM_AUTOMATIC_NETWORK, otherAutomaticNetwork]

    await chooseNewVmTemplate(form, NEW_VM_DISKLESS_TEMPLATE)

    expect(form.vmState.vifs).toEqual([
      { key: expect.any(String), network: NEW_VM_AUTOMATIC_NETWORK.id, mac: '' },
      { key: expect.any(String), network: otherAutomaticNetwork.id, mac: '' },
    ])
  })

  it('gives a template without network interface one on the management network when none is automatic', async () => {
    const form = mountForm()
    const managementNetwork = createNetwork({ id: 'network-management' as typeof NEW_VM_NETWORK.id })
    xoCollectionsMock.networks.value = [NEW_VM_NETWORK, managementNetwork]
    xoCollectionsMock.pifs.value = [
      createPif({ $network: NEW_VM_NETWORK.id }),
      createManagementPif(NEW_VM_POOL, managementNetwork.id),
    ]

    await chooseNewVmTemplate(form, NEW_VM_DISKLESS_TEMPLATE)

    expect(form.vmState.vifs).toEqual([{ key: expect.any(String), network: managementNetwork.id, mac: '' }])
  })

  it('leaves a template without network interface as is when the pool has no default network', async () => {
    const form = mountForm()
    xoCollectionsMock.networks.value = [NEW_VM_NETWORK]

    await chooseNewVmTemplate(form, NEW_VM_DISKLESS_TEMPLATE)

    expect(form.vmState.vifs).toEqual([])
  })

  it('lists a template disk that is a VDI snapshot', async () => {
    const vdiSnapshot = createVdiSnapshot({ name_label: 'Snapshot disk', $SR: NEW_VM_SR.id })
    const form = mountForm()
    vmDeviceCollectionsMock.vbds.value = [createVbd({ VDI: vdiSnapshot.id, position: '0' })]
    vmDeviceCollectionsMock.vdis.value = []
    vmDeviceCollectionsMock.vdiSnapshots.value = [vdiSnapshot]

    await chooseNewVmTemplate(form)

    expect(form.vmState.existingVdis).toMatchObject([
      { id: vdiSnapshot.id, name_label: 'Snapshot disk', sr: NEW_VM_SR.id, userdevice: '0' },
    ])
  })

  it('forgets the template when the pool changes', async () => {
    const form = await mountFormOnTemplate()

    form.vmState.pool = createPool({ id: OTHER_POOL_ID })
    await nextTick()

    expect(form.vmState.new_vm_template).toBeUndefined()
  })

  it('forgets the affinity host when the pool changes', async () => {
    const form = await mountFormOnTemplate()
    form.vmState.affinity_host = NEW_VM_HOST.id

    form.vmState.pool = createPool({ id: OTHER_POOL_ID })
    await nextTick()

    expect(form.vmState.affinity_host).toBeUndefined()
  })

  it('drops secure boot and the vTPM when the firmware becomes BIOS', async () => {
    const form = await mountFormOnTemplate()
    form.vmState.secureBoot = true
    form.vmState.createVtpm = true

    form.vmState.bootFirmware = 'bios'
    await nextTick()

    expect(form.vmState).toMatchObject({ secureBoot: false, createVtpm: false })
  })

  it('copies the host BIOS strings for a BIOS template that has some', async () => {
    const form = await mountFormOnTemplate(createVmTemplate({ bios_strings: { 'bios-vendor': 'Vendor' } }))

    expect(form.vmState.copyHostBiosStrings).toBe(true)
  })

  it('stops copying the host BIOS strings when the next template has none', async () => {
    const form = await mountFormOnTemplate(createVmTemplate({ bios_strings: { 'bios-vendor': 'Vendor' } }))

    form.vmState.new_vm_template = NEW_VM_DISKLESS_TEMPLATE
    await nextTick()

    expect(form.vmState.copyHostBiosStrings).toBe(false)
  })

  it('starts the configuration over when another template is chosen', async () => {
    const form = await mountFormOnTemplate()
    Object.assign(form.vmState, {
      installMode: 'cdrom',
      selectedVdi: NEW_VM_ISO.id,
      cloudConfig: '#cloud-config',
      networkConfig: 'network:',
    })
    form.addVdi()

    form.vmState.new_vm_template = NEW_VM_DISKLESS_TEMPLATE
    await nextTick()

    expect(form.vmState).toMatchObject({
      name: NEW_VM_DISKLESS_TEMPLATE.name_label,
      installMode: 'no-config',
      selectedVdi: undefined,
      cloudConfig: '',
      networkConfig: '',
      vdis: [],
      existingVdis: [],
      vifs: [{ network: NEW_VM_AUTOMATIC_NETWORK.id, mac: '' }],
    })
  })

  it('stops copying the host BIOS strings when the firmware becomes UEFI', async () => {
    const form = await mountFormOnTemplate(createVmTemplate({ bios_strings: { 'bios-vendor': 'Vendor' } }))

    form.vmState.bootFirmware = 'uefi'
    await nextTick()

    expect(form.vmState.copyHostBiosStrings).toBe(false)
  })
})

describe('isDirty', () => {
  it('is false before anything is chosen', () => {
    expect(mountForm().isDirty).toBe(false)
  })

  it('is false on the pool the route names', async () => {
    const router = createTestRouter()
    await router.push({ path: '/vm/new', query: { poolid: NEW_VM_POOL.id } })

    expect(mountForm({ router }).isDirty).toBe(false)
  })

  it('is true once a pool is chosen', () => {
    const form = mountForm()

    form.vmState.pool = NEW_VM_POOL

    expect(form.isDirty).toBe(true)
  })

  it('is true once a template is chosen', async () => {
    const router = createTestRouter()
    await router.push({ path: '/vm/new', query: { poolid: NEW_VM_POOL.id } })
    const form = mountForm({ router })

    form.vmState.new_vm_template = NEW_VM_DISK_TEMPLATE
    await nextTick()

    expect(form.isDirty).toBe(true)
  })
})

describe('templates', () => {
  it('lists the templates of the chosen pool only', async () => {
    const form = await mountFormOnTemplate()

    expect(form.templates.map(template => template.uuid)).toEqual([
      NEW_VM_DISK_TEMPLATE.uuid,
      NEW_VM_DISKLESS_TEMPLATE.uuid,
    ])
  })

  it('lists none without a pool', () => {
    expect(mountForm().templates).toEqual([])
  })
})

describe('poolSrs', () => {
  it('offers an SR of the pool that holds nothing yet', async () => {
    const form = await mountFormOnTemplate()
    const emptySr = createSr({ id: 'sr-empty' as typeof NEW_VM_SR.id, physical_usage: 0, usage: 0 })

    xoCollectionsMock.srs.value = [NEW_VM_SR, emptySr]

    expect(form.poolSrs.map(sr => sr.id)).toEqual([NEW_VM_SR.id, emptySr.id])
  })

  it('leaves out the ISO SRs, the SRs without capacity and those of another pool', async () => {
    const form = await mountFormOnTemplate()

    xoCollectionsMock.srs.value = [
      NEW_VM_SR,
      createSr({ id: 'sr-iso' as typeof NEW_VM_SR.id, content_type: 'iso' }),
      createSr({ id: 'sr-without-capacity' as typeof NEW_VM_SR.id, size: 0 }),
      createSr({ id: 'sr-other-pool' as typeof NEW_VM_SR.id, $pool: OTHER_POOL_ID }),
    ]

    expect(form.poolSrs.map(sr => sr.id)).toEqual([NEW_VM_SR.id])
  })
})

describe('isDiskTemplate', () => {
  it('is true for a template with a disk', async () => {
    expect((await mountFormOnTemplate()).isDiskTemplate).toBe(true)
  })

  it('is false for a template without disk', async () => {
    expect((await mountFormOnTemplate(NEW_VM_DISKLESS_TEMPLATE)).isDiskTemplate).toBe(false)
  })
})

describe('getIsoLabel', () => {
  it('prefixes the ISO with the name of its SR', async () => {
    const form = await mountFormOnTemplate()

    expect(form.isoVdis.map(form.getIsoLabel)).toEqual([`[${NEW_VM_ISO_SR_NAME}] ${NEW_VM_ISO.name_label}`])
  })
})

describe('defaultNetwork', () => {
  it('prefers the automatic network of the pool', async () => {
    expect((await mountFormOnTemplate()).defaultNetwork?.id).toBe(NEW_VM_AUTOMATIC_NETWORK.id)
  })

  it('falls back to the management network of the pool', async () => {
    const form = await mountFormOnTemplate()
    const managementNetwork = createNetwork({ id: 'network-management' as typeof NEW_VM_NETWORK.id })

    xoCollectionsMock.networks.value = [NEW_VM_NETWORK, managementNetwork]
    xoCollectionsMock.pifs.value = [
      createPif({ $network: NEW_VM_NETWORK.id }),
      createManagementPif(NEW_VM_POOL, managementNetwork.id),
    ]

    expect(form.defaultNetwork?.id).toBe(managementNetwork.id)
  })

  it('does not take a network without PIF for the management network', async () => {
    const form = await mountFormOnTemplate()
    const managementNetwork = createNetwork({ id: 'network-management' as typeof NEW_VM_NETWORK.id })

    xoCollectionsMock.networks.value = [NEW_VM_NETWORK, managementNetwork]
    xoCollectionsMock.pifs.value = [createManagementPif(NEW_VM_POOL, managementNetwork.id)]

    expect(form.defaultNetwork?.id).toBe(managementNetwork.id)
  })
})

describe('addVif', () => {
  it('adds an interface on the default network', async () => {
    const form = await mountFormOnTemplate()

    form.addVif()

    expect(form.vmState.vifs.at(-1)).toEqual({
      key: expect.any(String),
      network: NEW_VM_AUTOMATIC_NETWORK.id,
      mac: '',
    })
  })
})

describe('removeVif', () => {
  it('removes that interface and keeps the others', async () => {
    const form = await mountFormOnTemplate()
    form.addVif()

    form.removeVif(NEW_VM_TEMPLATE_VIF.id)

    expect(form.vmState.vifs).toMatchObject([{ network: NEW_VM_AUTOMATIC_NETWORK.id }])
  })
})

describe('addVdi', () => {
  it('adds an empty disk on the default SR of the pool', async () => {
    const form = await mountFormOnTemplate()

    form.addVdi()

    expect(form.vmState.vdis).toEqual([
      {
        key: expect.any(String),
        name_label: expect.stringMatching(/^Debian 12_/),
        name_description: 'Created by XO',
        sr: NEW_VM_POOL.default_SR,
        size: 0,
      },
    ])
  })
})

describe('removeVdi', () => {
  it('removes a disk of the template', async () => {
    const form = await mountFormOnTemplate()

    form.removeVdi(NEW_VM_TEMPLATE_VDI.id)

    expect(form.vmState.existingVdis).toEqual([])
  })
})

describe('undersizedExistingVdis', () => {
  it('lists the template disks made smaller than in the template', async () => {
    const form = await mountFormOnTemplate()

    form.vmState.existingVdis[0].size = 5

    expect(form.undersizedExistingVdis).toEqual([{ key: NEW_VM_TEMPLATE_VDI.id, minSize: 10 }])
  })

  it('is empty while every disk keeps at least its template size', async () => {
    expect((await mountFormOnTemplate()).undersizedExistingVdis).toEqual([])
  })
})

describe('canResizeExistingDisks', () => {
  it('is false without an installation configuration', async () => {
    expect((await mountFormOnTemplate()).canResizeExistingDisks).toBe(false)
  })

  it('is true when installing from an ISO', async () => {
    const form = await mountFormOnTemplate()

    form.vmState.installMode = 'cdrom'

    expect(form.canResizeExistingDisks).toBe(true)
  })

  it('restores the template size of the disks once they can no longer be resized', async () => {
    const form = await mountFormOnTemplate()
    form.vmState.installMode = 'cdrom'
    await nextTick()
    form.vmState.existingVdis[0].size = 20

    form.vmState.installMode = 'no-config'
    await nextTick()

    expect(form.vmState.existingVdis[0].size).toBe(10)
  })
})
