import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { NewSrRestPayload } from '@/modules/storage-repository/jobs/xo-sr-create.job.ts'
import {
  type NewSrAccessMode,
  type NewSrFormData,
  type NewSrInput,
  type NewSrType,
  SR_CONTENT_GROUP,
  type SrContentGroup,
  type SupportedSrType,
} from '@/modules/storage-repository/types/xo-sr-create.type.ts'
import { SR_ACCESS_MODE } from '@core/types/storage-repository.type.ts'

/** Static metadata for mapping, filtering and payload building. */
export const SR_TYPE_META: Record<
  NewSrType,
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

export function getAvailableSrTypes(accessMode: NewSrAccessMode): NewSrType[] {
  const shared = accessMode === SR_ACCESS_MODE.SHARED

  return (Object.keys(SR_TYPE_META) as NewSrType[]).filter(srType => SR_TYPE_META[srType].shared === shared)
}

export function groupSrTypesByContent(types: NewSrType[]): Record<SrContentGroup, NewSrType[]> {
  return {
    [SR_CONTENT_GROUP.VDI]: types.filter(type => SR_TYPE_META[type].group === SR_CONTENT_GROUP.VDI),
    [SR_CONTENT_GROUP.ISO]: types.filter(type => SR_TYPE_META[type].group === SR_CONTENT_GROUP.ISO),
  }
}

function getAuthFields(form: NewSrFormData): { username?: string; password?: string } {
  const auth: { username?: string; password?: string } = {}

  if (!form.useAuth) {
    return auth
  }

  if (form.username !== '') {
    auth.username = form.username
  }

  if (form.password !== '') {
    auth.password = form.password
  }

  return auth
}

export function buildNewSrInput(
  form: NewSrFormData & { type: NewSrType },
  resolvedHostId: FrontXoHost['id']
): NewSrInput {
  const base = {
    hostId: resolvedHostId,
    name: form.name,
    description: form.description,
  }

  const preferredImageFormatsField =
    form.preferredImageFormats !== '' ? { preferredImageFormats: form.preferredImageFormats } : {}

  switch (form.type) {
    case 'lvm':
    case 'ext':
      return { ...base, type: form.type, device: form.device, ...preferredImageFormatsField }
    case 'smb':
      return { ...base, type: form.type, server: form.server, ...getAuthFields(form), ...preferredImageFormatsField }
    case 'smbiso':
      return { ...base, type: form.type, server: form.server, ...getAuthFields(form) }
    case 'local':
      return { ...base, type: form.type, path: form.path }
    default:
      throw new Error(`Unsupported SR type: ${form.type}`)
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
