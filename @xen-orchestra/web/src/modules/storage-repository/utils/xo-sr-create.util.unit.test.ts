import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { NewSrInput } from '@/modules/storage-repository/types/xo-sr-create.type.ts'
import {
  buildNewSrRestPayload,
  getAvailableSrTypes,
  groupSrTypesByContent,
} from '@/modules/storage-repository/utils/xo-sr-create.util.ts'
import { SR_ACCESS_MODE } from '@core/types/storage-repository.type.ts'

const HOST_ID = 'host-456' as FrontXoHost['id']

const BASE_INPUT = { hostId: HOST_ID, name: 'My SR', description: '' }

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
