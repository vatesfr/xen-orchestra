import type { Vdi, Vif } from '@/modules/vm/types/new-xo-vm.type.ts'
import {
  buildSshCloudConfig,
  bytesToGiB,
  createNewVif,
  formatHostname,
  getAllVdis,
  getExistingVdisChanges,
  getExistingVdisDiff,
  getExistingVifsDiff,
  getTemplateVmDefaults,
  giBToBytes,
  isDiskVmTemplate,
  resolveConfigTemplate,
} from '@/modules/vm/utils/new-vm.util.ts'
import { createVbd } from '@/test/create-vbd.ts'
import { createVmTemplate } from '@/test/create-vm-template.ts'

const GIB = 1024 ** 3

function createFormVdi(overrides: Partial<Vdi> = {}): Vdi {
  return {
    key: 'vdi-1',
    id: 'vdi-1' as Vdi['id'],
    name_label: 'Template disk',
    name_description: 'Disk of the template',
    size: 10,
    sr: 'sr-123' as Vdi['sr'],
    userdevice: '0',
    ...overrides,
  }
}

function createFormVif(overrides: Partial<Vif> = {}): Vif {
  return {
    key: 'vif-123',
    id: 'vif-123' as Vif['id'],
    network: 'network-123' as Vif['network'],
    mac: '',
    device: '0',
    ...overrides,
  }
}

describe('bytesToGiB', () => {
  it('rounds down to a whole number of GiB', () => {
    expect(bytesToGiB(2.9 * GIB)).toBe(2)
  })
})

describe('giBToBytes', () => {
  it('converts GiB to bytes', () => {
    expect(giBToBytes(2)).toBe(2 * GIB)
  })
})

describe('formatHostname', () => {
  it('trims the name and joins its words with dashes', () => {
    expect(formatHostname('  web  server 1 ')).toBe('web-server-1')
  })
})

describe('resolveConfigTemplate', () => {
  it('replaces the name and index variables', () => {
    expect(resolveConfigTemplate('hostname: {name}-{index}', 'web', 0)).toBe('hostname: web-0')
  })

  it('keeps a variable escaped with a backslash as is', () => {
    expect(resolveConfigTemplate('\\{name} is {name}', 'web', 0)).toBe('{name} is web')
  })

  it('reads a doubled backslash as a backslash followed by the variable', () => {
    expect(resolveConfigTemplate('\\\\{name}', 'web', 0)).toBe('\\web')
  })

  it('leaves unknown variables untouched', () => {
    expect(resolveConfigTemplate('{unknown}', 'web', 0)).toBe('{unknown}')
  })
})

describe('buildSshCloudConfig', () => {
  it('declares the hostname and every authorized key', () => {
    expect(buildSshCloudConfig('web server', ['ssh-rsa AAA', 'ssh-ed25519 BBB'])).toBe(
      '#cloud-config\nhostname: web-server\nssh_authorized_keys:\n  - ssh-rsa AAA\n  - ssh-ed25519 BBB\n'
    )
  })
})

describe('getAllVdis', () => {
  it('lists the template disks kept, then the new disks', () => {
    const templateVdi = createFormVdi()
    const newVdi = createFormVdi({ key: 'new-vdi', id: undefined, name_label: 'New disk' })

    expect(getAllVdis({ existingVdis: [templateVdi], vdis: [newVdi] })).toEqual([templateVdi, newVdi])
  })

  it('lists nothing without any disk', () => {
    expect(getAllVdis({ existingVdis: [], vdis: [] })).toEqual([])
  })
})

describe('getExistingVdisDiff', () => {
  it('returns nothing for an unchanged disk', () => {
    expect(getExistingVdisDiff(createFormVdi(), createFormVdi(), true)).toBeUndefined()
  })

  it('returns only the changed fields', () => {
    const current = createFormVdi({ name_label: 'Renamed disk', sr: 'sr-other' as Vdi['sr'] })

    expect(getExistingVdisDiff(createFormVdi(), current, true)).toEqual({ name_label: 'Renamed disk', sr: 'sr-other' })
  })

  it('includes a new size when the disk can be resized', () => {
    expect(getExistingVdisDiff(createFormVdi(), createFormVdi({ size: 20 }), true)).toEqual({ size: 20 })
  })

  it('ignores a new size when the disk cannot be resized', () => {
    expect(getExistingVdisDiff(createFormVdi(), createFormVdi({ size: 20 }), false)).toBeUndefined()
  })
})

describe('getExistingVdisChanges', () => {
  const templateVdi = createFormVdi({ id: 'vdi-template' as Vdi['id'], userdevice: '0', size: 10 })

  it('tells what changed on a disk of the template', () => {
    const changes = getExistingVdisChanges([templateVdi], [{ ...templateVdi, name_label: 'Renamed' }], false)

    expect(changes).toEqual([
      { id: templateVdi.id, userdevice: '0', isDeleted: false, changes: { name_label: 'Renamed' } },
    ])
  })

  it('reports no change for a disk left as in the template', () => {
    expect(getExistingVdisChanges([templateVdi], [{ ...templateVdi }], true)[0].changes).toBeUndefined()
  })

  it('leaves the size out unless it is asked for', () => {
    const resizedVdis = [{ ...templateVdi, size: 20 }]

    expect(getExistingVdisChanges([templateVdi], resizedVdis, false)[0].changes).toBeUndefined()
    expect(getExistingVdisChanges([templateVdi], resizedVdis, true)[0].changes).toEqual({ size: 20 })
  })

  it('tells that a disk of the template was removed', () => {
    expect(getExistingVdisChanges([templateVdi], [], true)).toEqual([
      { id: templateVdi.id, userdevice: '0', isDeleted: true, changes: undefined },
    ])
  })

  it('skips a disk the template does not plug on a device', () => {
    expect(getExistingVdisChanges([{ ...templateVdi, userdevice: undefined }], [], true)).toEqual([])
  })
})

describe('createNewVif', () => {
  it('creates an interface on the network, with an automatically generated MAC address', () => {
    expect(createNewVif('network-123' as Vif['network'])).toEqual({
      key: expect.any(String),
      network: 'network-123',
      mac: '',
    })
  })

  it('gives each interface its own key', () => {
    const network = 'network-123' as Vif['network']

    expect(createNewVif(network).key).not.toBe(createNewVif(network).key)
  })
})

describe('getExistingVifsDiff', () => {
  it('returns nothing for an unchanged interface', () => {
    expect(getExistingVifsDiff(createFormVif(), createFormVif())).toBeUndefined()
  })

  it('returns the network and the MAC address when the network changes', () => {
    const current = createFormVif({ network: 'network-other' as Vif['network'] })

    expect(getExistingVifsDiff(createFormVif(), current)).toEqual({ network: 'network-other', mac: '' })
  })

  it('returns the network and the MAC address when the MAC address changes', () => {
    const current = createFormVif({ mac: 'aa:bb:cc:dd:ee:ff' })

    expect(getExistingVifsDiff(createFormVif(), current)).toEqual({ network: 'network-123', mac: 'aa:bb:cc:dd:ee:ff' })
  })
})

describe('isDiskVmTemplate', () => {
  const vbdId = createVbd().id

  it('is false without a template', () => {
    expect(isDiskVmTemplate(undefined)).toBe(false)
  })

  it('is false for a template without disk', () => {
    expect(isDiskVmTemplate(createVmTemplate({ name_label: 'Debian 12', $VBDs: [] }))).toBe(false)
  })

  it('is false for the "Other install media" template even with a disk', () => {
    expect(isDiskVmTemplate(createVmTemplate({ name_label: 'Other install media', $VBDs: [vbdId] }))).toBe(false)
  })

  it('is true for a template with a disk', () => {
    expect(isDiskVmTemplate(createVmTemplate({ name_label: 'Debian 12', $VBDs: [vbdId] }))).toBe(true)
  })
})

describe('getTemplateVmDefaults', () => {
  it('reads the defaults of the VM from the template', () => {
    const template = createVmTemplate({
      name_label: 'Debian 12',
      name_description: 'Debian template',
      isDefaultTemplate: false,
      tags: ['prod'],
      CPUs: { max: 4, number: 2 },
      memory: { dynamic: [2 * GIB, 4 * GIB], size: 4 * GIB, static: [GIB, 4 * GIB] },
      boot: { firmware: 'uefi' },
      secureBoot: true,
      high_availability: 'restart',
    })

    expect(getTemplateVmDefaults(template)).toEqual({
      name: 'Debian 12',
      description: 'Debian template',
      ram: 4 * GIB,
      tags: ['prod'],
      vCPU: 2,
      secureBoot: true,
      bootFirmware: 'uefi',
      highAvailability: 'restart',
    })
  })

  it('leaves the description empty for a default template', () => {
    const template = createVmTemplate({ name_description: 'Shipped with the host', isDefaultTemplate: true })

    expect(getTemplateVmDefaults(template).description).toBe('')
  })

  it('falls back to the BIOS firmware when the template sets none', () => {
    expect(getTemplateVmDefaults(createVmTemplate({ boot: {} })).bootFirmware).toBe('bios')
  })
})
