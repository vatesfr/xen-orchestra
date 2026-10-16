import type { XoBackupFormat } from '@/modules/backup/types/xo-backup.ts'
import type { DiskFormatType, ParsedBackupRepositoryUrl } from 'xo-remote-parser'

const DISK_FORMAT_BY_BACKUP_FORMAT: Record<XoBackupFormat, DiskFormatType> = {
  block: 'vhdDirectory',
  vhd: 'vhd',
  hbd: 'hbd',
}

const BACKUP_FORMAT_BY_DISK_FORMAT: Record<DiskFormatType, XoBackupFormat> = {
  vhd: 'vhd',
  vhdDirectory: 'block',
  hbd: 'hbd',
}

export function getDiskFormatFromBackupFormat(backupFormat: XoBackupFormat): DiskFormatType {
  return DISK_FORMAT_BY_BACKUP_FORMAT[backupFormat]
}

export function getBackupFormatFromDiskFormat(diskFormat: DiskFormatType): XoBackupFormat {
  return BACKUP_FORMAT_BY_DISK_FORMAT[diskFormat]
}

export function getDiskFormatFromUrl(parsedUrl: ParsedBackupRepositoryUrl): DiskFormatType {
  return parsedUrl.diskFormat ?? (parsedUrl.useVhdDirectory === true ? 'vhdDirectory' : 'vhd')
}

export function isBackupRepositoryUsingVhdDirectory(parsedUrl: ParsedBackupRepositoryUrl): boolean {
  return getDiskFormatFromUrl(parsedUrl) === 'vhdDirectory'
}
