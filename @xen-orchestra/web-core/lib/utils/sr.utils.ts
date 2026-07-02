import {
  SR_ACCESS_MODE,
  SR_CONTENT_GROUP,
  SR_CONTENT_TYPE,
  SR_SCOPE_TYPE,
  type NewSrInput,
  type NewSrPayload,
  type SrAccessMode,
  type SrContentGroup,
  type SrContentType,
  type SrScope,
  type SrType,
} from '@core/types/storage-repository.type.ts'

export function getSrAccessMode(srs: { shared: boolean }[]): SrAccessMode {
  const hasShared = srs.some(sr => sr.shared)
  const hasLocal = srs.some(sr => !sr.shared)

  if (hasShared && hasLocal) {
    return SR_ACCESS_MODE.MIXED
  }

  if (hasShared) {
    return SR_ACCESS_MODE.SHARED
  }

  return SR_ACCESS_MODE.LOCAL
}

export type SrModalInfoVariant = 'host' | 'pool-local' | 'pool-mixed' | 'pool-shared'

export function getSrModalInfoVariant(scope: SrScope, accessMode: SrAccessMode): SrModalInfoVariant {
  if (scope.type === SR_SCOPE_TYPE.HOST) {
    return 'host'
  }

  if (accessMode === SR_ACCESS_MODE.LOCAL) {
    return 'pool-local'
  }

  if (accessMode === SR_ACCESS_MODE.MIXED) {
    return 'pool-mixed'
  }

  return 'pool-shared'
}

/** Static metadata for mapping, filtering and payload building. */
export const SR_TYPE_META: Record<
  SrType,
  {
    group: SrContentGroup
    shared: boolean
    xapiType: string
    contentType: SrContentType
    requiresEraseConfirm: boolean
  }
> = {
  lvm: {
    group: SR_CONTENT_GROUP.VDI,
    shared: false,
    xapiType: 'lvm',
    contentType: SR_CONTENT_TYPE.USER,
    requiresEraseConfirm: true,
  },
  ext: {
    group: SR_CONTENT_GROUP.VDI,
    shared: false,
    xapiType: 'ext',
    contentType: SR_CONTENT_TYPE.USER,
    requiresEraseConfirm: true,
  },
  smb: {
    group: SR_CONTENT_GROUP.VDI,
    shared: true,
    xapiType: 'smb',
    contentType: SR_CONTENT_TYPE.USER,
    requiresEraseConfirm: false,
  },
  local: {
    group: SR_CONTENT_GROUP.ISO,
    shared: false,
    xapiType: 'iso',
    contentType: SR_CONTENT_TYPE.ISO,
    requiresEraseConfirm: false,
  },
  smbiso: {
    group: SR_CONTENT_GROUP.ISO,
    shared: true,
    xapiType: 'iso',
    contentType: SR_CONTENT_TYPE.ISO,
    requiresEraseConfirm: false,
  },
}

export function getAvailableSrTypes(accessMode: SrAccessMode): SrType[] {
  const shared = accessMode === SR_ACCESS_MODE.SHARED
  return (Object.keys(SR_TYPE_META) as SrType[]).filter(srType => SR_TYPE_META[srType].shared === shared)
}

export function groupSrTypesByContent(types: SrType[]) {
  return {
    vdi: types.filter(t => SR_TYPE_META[t].group === SR_CONTENT_GROUP.VDI),
    iso: types.filter(t => SR_TYPE_META[t].group === SR_CONTENT_GROUP.ISO),
  }
}

export function buildNewSrPayload(input: NewSrInput): NewSrPayload {
  const meta = SR_TYPE_META[input.type]
  const deviceConfig: Record<string, string> = {}

  switch (input.type) {
    case 'lvm':
    case 'ext':
      deviceConfig.device = input.device
      break
    case 'smb':
      deviceConfig.server = input.server
      if (input.username !== undefined) {
        deviceConfig.username = input.username
      }
      if (input.password !== undefined) {
        deviceConfig.password = input.password
      }
      break
    case 'local':
      deviceConfig.location = input.path
      deviceConfig.legacy_mode = 'true'
      break
    case 'smbiso':
      deviceConfig.location = input.server.replace(/\\/g, '/')
      deviceConfig.type = 'cifs'
      if (input.username !== undefined) {
        deviceConfig.username = input.username
      }
      if (input.password !== undefined) {
        deviceConfig.cifspassword = input.password
      }
      break
  }

  const payload: NewSrPayload = {
    hostId: input.hostId,
    nameLabel: input.name,
    xapiType: meta.xapiType,
    shared: meta.shared,
    contentType: meta.contentType,
    deviceConfig,
  }

  if (input.description !== '') {
    payload.nameDescription = input.description
  }

  return payload
}
