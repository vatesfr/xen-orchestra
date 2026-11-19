import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { buildNewSrInput, type NewSrFormData } from '@/modules/storage-repository/form/new/sr-form.type.ts'
import { SR_ACCESS_MODE, type SrType } from '@core/types/storage-repository.type.ts'

const HOST_ID = 'host-456' as FrontXoHost['id']

function createFormData(overrides: Partial<NewSrFormData> & { type: SrType }): NewSrFormData & { type: SrType } {
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
