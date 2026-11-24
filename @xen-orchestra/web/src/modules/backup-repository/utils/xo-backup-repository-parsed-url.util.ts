import { parse as parseBackupRepositoryUrl, type ParsedBackupRepositoryUrl } from 'xo-remote-parser'

export function parseBackupRepositoryUrlSafely(url: string): ParsedBackupRepositoryUrl | undefined {
  try {
    return parseBackupRepositoryUrl(url)
  } catch {
    return undefined
  }
}
