import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { NewSrInput, SrAccessMode, SrPreferredImageFormats, SrType } from '@core/types/storage-repository.type.ts'

export type NewSrFormData = {
  poolId: FrontXoPool['id'] | undefined
  hostId: FrontXoHost['id'] | undefined
  accessMode: SrAccessMode
  type: SrType | undefined
  name: string
  description: string
  device: string
  server: string
  path: string
  username: string
  password: string
  useAuth: boolean
  preferredImageFormats: '' | SrPreferredImageFormats
}

function getAuthFields(form: NewSrFormData): { username?: string; password?: string } {
  const auth: { username?: string; password?: string } = {}

  if (form.useAuth) {
    if (form.username !== '') {
      auth.username = form.username
    }
    if (form.password !== '') {
      auth.password = form.password
    }
  }

  return auth
}

export function buildNewSrInput(form: NewSrFormData & { type: SrType }, resolvedHostId: string): NewSrInput {
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
