import { type BackupRepositoryType, parse as parseBackupRepositoryUrl } from 'xo-remote-parser'

export function getBackupRepositoryType(url: string): BackupRepositoryType | undefined {
  try {
    return parseBackupRepositoryUrl(url).type
  } catch {
    return undefined
  }
}
