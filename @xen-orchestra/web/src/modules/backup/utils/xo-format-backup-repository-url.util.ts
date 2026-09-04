import type {
  BackupRepositoryUrlOptions,
  BackupRepositoryUrlInput,
} from '@/modules/backup/types/xo-backup-repository.type.ts'

const sanitizePath = (path: string | undefined) =>
  (path ?? '')
    .split('/')
    .map(segment => segment.trim())
    .filter(Boolean)
    .join('/')

function formatOptions(options: BackupRepositoryUrlOptions): string {
  const search = new URLSearchParams()

  for (const [key, value] of Object.entries(options)) {
    if (value !== undefined) {
      search.append(key, JSON.stringify(value))
    }
  }

  return search.toString()
}

export function formatBackupRepositoryUrl(info: BackupRepositoryUrlInput): string {
  const { type, host, path, port, username, password, domain, protocol = type, region, ...options } = info

  const credentials = `${encodeURIComponent(username ?? '')}:${encodeURIComponent(password ?? '')}@${host}`

  let url: string

  switch (type) {
    case 'nfs':
      url = `nfs://${host}:${port !== undefined ? `${port}:` : ''}`
      break
    case 'smb':
      url = `smb://${username}:${password}@${domain}\\\\${host}`
      break
    case 's3':
      url = `${protocol === 'https' ? 's3' : 's3+http'}://${credentials}`
      break
    case 'azure':
      url = `azure://${credentials}`
      break
    case 'azurite':
      url = `${protocol === 'https' ? 'azurite' : 'azurite+http'}://${credentials}`
      break
    default:
      url = 'file://'
  }

  const sanitized = sanitizePath(path)

  // FIXME saving with the windows fashion \ was a bad idea :,(
  url += type === 'smb' ? `\0${sanitized.split('/').join('\\')}` : `/${sanitized}`

  const search = formatOptions(options)

  if (search !== '') {
    url += `?${search}`
  }

  if (type === 's3' && region !== undefined) {
    url += `#${region}`
  }

  return url
}
