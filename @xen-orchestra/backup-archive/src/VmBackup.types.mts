import { RemoteDisk } from '@xen-orchestra/backups/disks'
import RemoteHandlerAbstract from '@xen-orchestra/fs'

export function isMetadataFile(filename: string): boolean {
  return filename.endsWith('.json')
}
export function isVhdFile(filename: string) {
  return filename.endsWith('.vhd')
}
export function isVhdSumFile(filename: string) {
  return filename.endsWith('.vhd.checksum')
}
export function isXvaFile(filename: string) {
  return filename.endsWith('.xva')
}
export function isXvaSumFile(filename: string) {
  return filename.endsWith('.xva.checksum')
}
export function isVhdAlias(filename: string) {
  return filename.endsWith('.alias.vhd')
}
export function isDiskFile(filename: string) {
  return isVhdFile(filename) && !isVhdAlias(filename)
}
export type AnomalyReport = {
  multipleChildren: Array<string>
  brokenChains: Array<string>
  incompleteChains: Array<string>
}

export interface PartialBackupMetadata {
  mode: 'full' | 'delta'
  xva?: string
  vhds?: Record<string, string>
  jobId: string
  scheduleId: string
  timestamp: number
}

export type MergeLimiter = (fn: (...args: any[]) => any) => (...args: any[]) => any

export interface BackupCleanOptions {
  fix?: boolean
  merge?: boolean
  remove?: boolean
  logInfo?: (message: any, opts?: object) => void
  logWarn?: (message: any, opts?: object) => void
}

export type ResolvedBackupCleanOptions = BackupCleanOptions & {
  logInfo: (message: any, opts?: object) => void
  logWarn: (message: any, opts?: object) => void
}

export interface ArchiveCleanOptions {
  remove?: boolean
  /**
   * Set of disk paths still referenced by surviving backups.
   * Ignored by full backups; reserved for incremental use.
   */
  activeDisks?: Set<string>
  mergeLimiter?: MergeLimiter
}

export interface BackupLineageInterface {
  init(): Promise<void>
  check(): Promise<void>
  clean(opts?: ArchiveCleanOptions): Promise<Set<string>>

  getOrphanDisks(): Set<string>
  getLinkedBackups(): Map<string, RemoteDisk>
}

export interface VmBackupInterface {
  handler: RemoteHandlerAbstract
  // metadataPath: string
  // metadata: PartialBackupMetadata
  rootPath: string
  opts: BackupCleanOptions

  init(): Promise<void>
  check(): Promise<object>
  clean(opts?: ArchiveCleanOptions): Promise<Array<string>>
  getAssociatedFiles(opts: object): Array<string>
}
