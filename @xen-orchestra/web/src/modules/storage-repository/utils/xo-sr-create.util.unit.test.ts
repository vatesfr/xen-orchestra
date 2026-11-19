import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { NewSrFormData, NewSrInput, NewSrType } from '@/modules/storage-repository/types/xo-sr-create.type.ts'
import {
  buildNewSrInput,
  buildNewSrRestPayload,
  getAvailableSrTypes,
  groupSrTypesByContent,
} from '@/modules/storage-repository/utils/xo-sr-create.util.ts'
import { SR_ACCESS_MODE } from '@core/types/storage-repository.type.ts'

const HOST_ID = 'host-456' as FrontXoHost['id']

const BASE_INPUT = { hostId: HOST_ID, name: 'My SR', description: '' }

function createFormData(overrides: Partial<NewSrFormData> & { type: NewSrType }): NewSrFormData & { type: NewSrType } {
  return {
    poolId: undefined,
    hostId: undefined,
    accessMode: SR_ACCESS_MODE.LOCAL,
    name: 'My SR',
    description: 'Fast disks',
    device: '/dev/sdb',
    server: 'nas',
    path: '/opt/iso',
    username: 'admin',
    password: 'pw',
    useAuth: true,
    preferredImageFormats: 'vhd',
    ...overrides,
  }
}

describe('getAvailableSrTypes', () => {
  it('offers the shared types in shared access mode', () => {
    expect(getAvailableSrTypes(SR_ACCESS_MODE.SHARED)).toEqual(['smb', 'smbiso'])
  })

  it('offers the local types in local access mode', () => {
    expect(getAvailableSrTypes(SR_ACCESS_MODE.LOCAL)).toEqual(['lvm', 'ext', 'local'])
  })
})

describe('groupSrTypesByContent', () => {
  it('splits the types between VDI and ISO SRs', () => {
    expect(groupSrTypesByContent(['lvm', 'ext', 'smb', 'local', 'smbiso'])).toEqual({
      vdi: ['lvm', 'ext', 'smb'],
      iso: ['local', 'smbiso'],
    })
  })

  it('leaves a group empty when no type belongs to it', () => {
    expect(groupSrTypesByContent(['smbiso'])).toEqual({ vdi: [], iso: ['smbiso'] })
  })
})

describe('buildNewSrRestPayload', () => {
  it.each(['lvm', 'ext'] as const)('configures the device of a %s SR', type => {
    expect(buildNewSrRestPayload({ ...BASE_INPUT, type, device: '/dev/sdb' })).toEqual({
      hostId: HOST_ID,
      name_label: 'My SR',
      SR_type: type,
      device_config: { device: '/dev/sdb' },
    })
  })

  it('configures the server and the credentials of an SMB SR', () => {
    const input: NewSrInput = {
      ...BASE_INPUT,
      type: 'smb',
      server: '\\\\nas\\share',
      username: 'admin',
      password: 'pw',
    }

    expect(buildNewSrRestPayload(input)).toEqual({
      hostId: HOST_ID,
      name_label: 'My SR',
      SR_type: 'smb',
      device_config: { server: '\\\\nas\\share', username: 'admin', password: 'pw' },
    })
  })

  it('creates a local ISO SR in legacy mode, which keeps it local to its host', () => {
    expect(buildNewSrRestPayload({ ...BASE_INPUT, type: 'local', path: '/opt/iso' })).toEqual({
      hostId: HOST_ID,
      name_label: 'My SR',
      SR_type: 'iso',
      device_config: { location: '/opt/iso', legacy_mode: 'true' },
    })
  })

  it('creates an SMB ISO SR as CIFS, with forward slashes and the CIFS password key', () => {
    const input: NewSrInput = {
      ...BASE_INPUT,
      type: 'smbiso',
      server: '\\\\nas\\iso',
      username: 'admin',
      password: 'pw',
    }

    expect(buildNewSrRestPayload(input)).toEqual({
      hostId: HOST_ID,
      name_label: 'My SR',
      SR_type: 'iso',
      device_config: { location: '//nas/iso', type: 'cifs', username: 'admin', cifspassword: 'pw' },
    })
  })

  it.each(['smb', 'smbiso'] as const)('sends no credentials for a %s SR without them', type => {
    expect(buildNewSrRestPayload({ ...BASE_INPUT, type, server: 'nas' }).device_config).not.toHaveProperty('username')
  })

  it('sends the preferred image formats when chosen', () => {
    const payload = buildNewSrRestPayload({
      ...BASE_INPUT,
      type: 'lvm',
      device: '/dev/sdb',
      preferredImageFormats: 'qcow2, vhd',
    })

    expect(payload.device_config['preferred-image-formats']).toBe('qcow2, vhd')
  })

  it('sends the description when there is one', () => {
    const payload = buildNewSrRestPayload({ ...BASE_INPUT, description: 'Fast disks', type: 'ext', device: '/dev/sdb' })

    expect(payload.name_description).toBe('Fast disks')
  })

  it('leaves out an empty description', () => {
    expect(buildNewSrRestPayload({ ...BASE_INPUT, type: 'ext', device: '/dev/sdb' })).not.toHaveProperty(
      'name_description'
    )
  })
})

describe('buildNewSrInput', () => {
  it.each(['lvm', 'ext'] as const)('keeps only the device of a %s SR', type => {
    expect(buildNewSrInput(createFormData({ type }), HOST_ID)).toEqual({
      hostId: HOST_ID,
      name: 'My SR',
      description: 'Fast disks',
      type,
      device: '/dev/sdb',
      preferredImageFormats: 'vhd',
    })
  })

  it('keeps the server and the credentials of an SMB SR', () => {
    expect(buildNewSrInput(createFormData({ type: 'smb' }), HOST_ID)).toEqual({
      hostId: HOST_ID,
      name: 'My SR',
      description: 'Fast disks',
      type: 'smb',
      server: 'nas',
      username: 'admin',
      password: 'pw',
      preferredImageFormats: 'vhd',
    })
  })

  it('keeps only the path of a local ISO SR, which has no preferred image formats', () => {
    expect(buildNewSrInput(createFormData({ type: 'local' }), HOST_ID)).toEqual({
      hostId: HOST_ID,
      name: 'My SR',
      description: 'Fast disks',
      type: 'local',
      path: '/opt/iso',
    })
  })

  it('gives an SMB ISO SR no preferred image formats', () => {
    expect(buildNewSrInput(createFormData({ type: 'smbiso' }), HOST_ID)).not.toHaveProperty('preferredImageFormats')
  })

  it('drops the credentials when authentication is off', () => {
    const input = buildNewSrInput(createFormData({ type: 'smb', useAuth: false }), HOST_ID)

    expect(input).not.toHaveProperty('username')
    expect(input).not.toHaveProperty('password')
  })

  it('drops an empty credential', () => {
    const input = buildNewSrInput(createFormData({ type: 'smbiso', password: '' }), HOST_ID)

    expect(input).toMatchObject({ username: 'admin' })
    expect(input).not.toHaveProperty('password')
  })

  it('drops preferred image formats left empty', () => {
    expect(buildNewSrInput(createFormData({ type: 'lvm', preferredImageFormats: '' }), HOST_ID)).not.toHaveProperty(
      'preferredImageFormats'
    )
  })
})
