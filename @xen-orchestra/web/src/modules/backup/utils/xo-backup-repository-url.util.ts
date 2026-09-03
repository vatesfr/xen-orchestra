export const BACKUP_REPOSITORY_TYPES = ['file', 'nfs', 'smb', 's3', 'azure', 'azurite'] as const

export type BackupRepositoryType = (typeof BACKUP_REPOSITORY_TYPES)[number]
export type BackupRepositoryProtocol = 'http' | 'https'

// Serialized options in the URL query string
export type BackupRepositoryOptions = {
  allowUnauthorized?: boolean
  encryptionKey?: string
  useVhdDirectory?: boolean
}

export type FileBackupRepositoryInfo = BackupRepositoryOptions & {
  type: 'file'
  path: string
}

// invalidUrl is set when the path could not be fully parsed and part of it was dropped.
// XO 5 uses it to offer rewriting the stored URL.
export type NfsBackupRepositoryInfo = BackupRepositoryOptions & {
  type: 'nfs'
  host: string
  port: string | undefined
  path: string
  invalidUrl?: true
}

export type SmbBackupRepositoryInfo = BackupRepositoryOptions & {
  type: 'smb'
  host: string
  path: string
  domain: string
  username: string
  password: string
}

export type S3BackupRepositoryInfo = BackupRepositoryOptions & {
  type: 's3'
  protocol: BackupRepositoryProtocol
  host: string
  path: string
  region: string | undefined
  username: string
  password: string
}

export type AzureBackupRepositoryInfo = BackupRepositoryOptions & {
  type: 'azure' | 'azurite'
  protocol: BackupRepositoryProtocol
  host: string
  port: string
  path: string
  username: string
  password: string
}

export type BackupRepositoryInfo =
  | FileBackupRepositoryInfo
  | NfsBackupRepositoryInfo
  | SmbBackupRepositoryInfo
  | S3BackupRepositoryInfo
  | AzureBackupRepositoryInfo

export type BackupRepositoryInfoInput = BackupRepositoryOptions & {
  type: BackupRepositoryType
  host?: string
  port?: string
  path?: string
  protocol?: BackupRepositoryProtocol
  region?: string
  domain?: string
  username?: string
  password?: string
}

const NFS_RE = /^([^:]+):(?:(\d+):)?([^:?]+)(\?[^?]*)?$/
const SMB_RE = /^([^:]+):(.+)@([^@]+)\\\\([^\0?]+)(?:\0([^?]*))?(\?[^?]*)?$/

// Part 1 - Parse URL

const withLeadingSlash = (path: string) => `/${path.replace(/^\/+/, '')}`

const sanitizePath = (path: string | undefined) =>
  (path ?? '')
    .split('/')
    .map(segment => segment.trim())
    .filter(Boolean)
    .join('/')

function parseOptions(search: string): BackupRepositoryOptions {
  const options: Record<string, unknown> = {}

  for (const [key, value] of new URLSearchParams(search)) {
    // Incorrect values were recorded in the user-side database (introduced by #6270)
    if (value === '') {
      options[key] = false
    } else {
      try {
        options[key] = JSON.parse(value)
      } catch {
        options[key] = value
      }
    }
  }

  return options as BackupRepositoryOptions
}

function parseCredentialsUrl(url: string) {
  const parsed = new URL(url)

  return {
    hash: parsed.hash,
    host: parsed.host,
    port: parsed.port,
    path: decodeURIComponent(parsed.pathname),
    username: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    options: parseOptions(parsed.search),
  }
}

function parseFileUrl(rest: string): FileBackupRepositoryInfo {
  const [path = '', search = ''] = rest.split('?')

  return { ...parseOptions(search), type: 'file', path: withLeadingSlash(path) }
}

function parseNfsUrl(rest: string): NfsBackupRepositoryInfo {
  const matches = NFS_RE.exec(rest)

  // a colon in the path breaks NFS_RE and is still accepted by the XO 5 remote form: fall back to the legacy split (commit: https://github.com/vatesfr/xen-orchestra/commit/fb1bf6a1e748b457f2d2b89ba02fa104554c03df)
  if (matches === null) {
    const [host = '', path = ''] = rest.split(':')

    return { type: 'nfs', host, port: undefined, path: withLeadingSlash(path), invalidUrl: true }
  }

  // matches[0] is the complete match
  const host = matches[1]
  const port: string | undefined = matches[2]
  const path = matches[3]
  const search = matches[4] ?? ''

  return { ...parseOptions(search), type: 'nfs', host, port, path: withLeadingSlash(path) }
}

function parseSmbUrl(rest: string): SmbBackupRepositoryInfo | undefined {
  const matches = SMB_RE.exec(rest)

  if (matches === null) {
    return undefined
  }

  // matches[0] is the complete match
  const username = matches[1]
  const password = matches[2]
  const domain = matches[3]
  const host = matches[4]
  const path = matches[5] ?? ''
  const search = matches[6] ?? ''

  return { ...parseOptions(search), type: 'smb', host, path, domain, username, password }
}

function parseS3Url(url: string, protocol: BackupRepositoryProtocol): S3BackupRepositoryInfo {
  const { hash, host, path, username, password, options } = parseCredentialsUrl(url)

  return {
    ...options,
    type: 's3',
    protocol,
    host,
    path,
    region: hash === '' ? undefined : hash.slice(1),
    username,
    password,
  }
}

function parseAzureUrl(
  url: string,
  type: AzureBackupRepositoryInfo['type'],
  protocol: BackupRepositoryProtocol
): AzureBackupRepositoryInfo {
  const { host, port, path, username, password, options } = parseCredentialsUrl(url)

  return { ...options, type, protocol, host, port, path, username, password }
}

export function parseBackupRepositoryUrl(url: string): BackupRepositoryInfo | undefined {
  const [scheme, rest = ''] = url.split('://')

  switch (scheme) {
    case 'file':
      return parseFileUrl(rest)
    case 'nfs':
      return parseNfsUrl(rest)
    case 'smb':
      return parseSmbUrl(rest)
    case 's3':
      return parseS3Url(url, 'https')
    case 's3+http':
      return parseS3Url(url, 'http')
    case 'azure':
      return parseAzureUrl(url, 'azure', 'https')
    case 'azurite':
      return parseAzureUrl(url, 'azurite', 'https')
    case 'azurite+http':
      return parseAzureUrl(url, 'azurite', 'http')
    default:
      return undefined
  }
}

// Part 2 - Format URL

function formatOptions(options: BackupRepositoryOptions): string {
  const search = new URLSearchParams()

  for (const [key, value] of Object.entries(options)) {
    if (value !== undefined) {
      search.append(key, JSON.stringify(value))
    }
  }

  return search.toString()
}

export function formatBackupRepositoryUrl(info: BackupRepositoryInfoInput): string {
  const {
    type,
    host,
    path,
    port,
    username,
    password,
    domain,
    protocol = type,
    region,
    ...options
  } = info as BackupRepositoryInfoInput

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
