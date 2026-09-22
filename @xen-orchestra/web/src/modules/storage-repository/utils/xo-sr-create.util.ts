import type { NewSrRestPayload } from '@/modules/storage-repository/jobs/xo-sr-create.job.ts'
import type { NewSrAccessMode, NewSrInput, SupportedSrType } from '@/modules/storage-repository/types/xo-sr-create.type.ts'
import {
  SR_ACCESS_MODE,
  SR_CONTENT_GROUP,
  type SrContentGroup,
  type SrType,
} from '@core/types/storage-repository.type.ts'

/** Static metadata for mapping, filtering and payload building. */
export const SR_TYPE_META: Record<
  SrType,
  {
    group: SrContentGroup
    shared: boolean
    xapiType: SupportedSrType
    requiresEraseConfirm: boolean
    supportsPreferredImageFormats: boolean
  }
> = {
  lvm: {
    group: SR_CONTENT_GROUP.VDI,
    shared: false,
    xapiType: 'lvm',
    requiresEraseConfirm: true,
    supportsPreferredImageFormats: true,
  },
  ext: {
    group: SR_CONTENT_GROUP.VDI,
    shared: false,
    xapiType: 'ext',
    requiresEraseConfirm: true,
    supportsPreferredImageFormats: true,
  },
  smb: {
    group: SR_CONTENT_GROUP.VDI,
    shared: true,
    xapiType: 'smb',
    requiresEraseConfirm: false,
    supportsPreferredImageFormats: true,
  },
  local: {
    group: SR_CONTENT_GROUP.ISO,
    shared: false,
    xapiType: 'iso',
    requiresEraseConfirm: false,
    supportsPreferredImageFormats: false,
  },
  smbiso: {
    group: SR_CONTENT_GROUP.ISO,
    shared: true,
    xapiType: 'iso',
    requiresEraseConfirm: false,
    supportsPreferredImageFormats: false,
  },
}

export function getAvailableSrTypes(accessMode: NewSrAccessMode): SrType[] {
  const shared = accessMode === SR_ACCESS_MODE.SHARED

  return (Object.keys(SR_TYPE_META) as SrType[]).filter(srType => SR_TYPE_META[srType].shared === shared)
}

export function groupSrTypesByContent(types: SrType[]) {
  return {
    vdi: types.filter(type => SR_TYPE_META[type].group === SR_CONTENT_GROUP.VDI),
    iso: types.filter(type => SR_TYPE_META[type].group === SR_CONTENT_GROUP.ISO),
  }
}

export function buildNewSrRestPayload(input: NewSrInput): NewSrRestPayload {
  const meta = SR_TYPE_META[input.type]
  const device_config: Record<string, string> = {}

  switch (input.type) {
    case 'lvm':
    case 'ext':
      device_config.device = input.device
      break

    case 'smb':
      device_config.server = input.server
      if (input.username !== undefined) {
        device_config.username = input.username
      }

      if (input.password !== undefined) {
        device_config.password = input.password
      }
      break

    case 'local':
      device_config.location = input.path
      device_config.legacy_mode = 'true'
      break

    case 'smbiso':
      device_config.location = input.server.replace(/\\/g, '/')
      device_config.type = 'cifs'
      if (input.username !== undefined) {
        device_config.username = input.username
      }

      if (input.password !== undefined) {
        device_config.cifspassword = input.password
      }
      break
  }

  if ('preferredImageFormats' in input && input.preferredImageFormats !== undefined) {
    device_config['preferred-image-formats'] = input.preferredImageFormats
  }

  const restPayload: NewSrRestPayload = {
    hostId: input.hostId,
    name_label: input.name,
    SR_type: meta.xapiType,
    device_config,
  }

  if (input.description !== '') {
    restPayload.name_description = input.description
  }

  return restPayload
}
