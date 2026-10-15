import type {
  BackupRepositoryProtocol,
  BackupRepositoryUrlOptions,
  ParsedAzureBackupRepositoryUrl,
  ParsedBackupRepositoryUrl,
  ParsedFileBackupRepositoryUrl,
  ParsedNfsBackupRepositoryUrl,
  ParsedS3BackupRepositoryUrl,
  ParsedSmbBackupRepositoryUrl,
  UnknownParsedBackupRepositoryUrl,
} from './types'
import urlParser from 'url-parse'

const NFS_RE = /^([^:]+):(?:(\d+):)?([^:?]+)(\?[^?]*)?$/
const SMB_RE = /^([^:]+):(.+)@([^@]+)\\\\([^\0?]+)(?:\0([^?]*))?(\?[^?]*)?$/

const withLeadingSlash = (path: string) => `/${path.replace(/^\/+/, '')}`

function parseOptions(search: string): BackupRepositoryUrlOptions {
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

  return options as BackupRepositoryUrlOptions
}

function parseCredentialsUrl(url: string) {
  const parsed = urlParser(url, false)

  return {
    hash: parsed.hash,
    host: parsed.host,
    port: parsed.port,
    path: parsed.pathname,
    username: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    search: parsed.query,
  }
}

function parseFileUrl(rest: string): ParsedFileBackupRepositoryUrl {
  const [path = '', search = ''] = rest.split('?')

  return { ...parseOptions(search), type: 'file', path: withLeadingSlash(path) }
}

function parseNfsUrl(rest: string): ParsedNfsBackupRepositoryUrl {
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

function parseSmbUrl(rest: string): ParsedSmbBackupRepositoryUrl | UnknownParsedBackupRepositoryUrl {
  const matches = SMB_RE.exec(rest)

  if (matches === null) {
    return {}
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

function parseS3Url(url: string, protocol: BackupRepositoryProtocol): ParsedS3BackupRepositoryUrl {
  const { hash, host, path, username, password, search } = parseCredentialsUrl(url)

  return {
    ...parseOptions(search),
    type: 's3',
    protocol,
    host,
    path,
    region: hash.length < 2 ? undefined : hash.slice(1),
    username,
    password,
  }
}

function parseAzureUrl(
  url: string,
  type: ParsedAzureBackupRepositoryUrl['type'],
  protocol: BackupRepositoryProtocol
): ParsedAzureBackupRepositoryUrl {
  const { host, port, path, username, password, search } = parseCredentialsUrl(url)

  return { ...parseOptions(search), type, protocol, host, port, path, username, password }
}

export function parse(url: string): ParsedBackupRepositoryUrl {
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
      return {}
  }
}
