import RemoteHandlerAbstract from '@xen-orchestra/fs'
import { basename } from 'node:path'

export type AnomalyReport = {
  multipleChildren: Array<string>
  brokenChains: Array<string>
  incompleteChains: Array<string>
}

export interface PartialBackupMetadata {
  mode: 'full' | 'delta'
  xva?: string
  vhds?: Record<string, string>
  vdis?: Record<string, unknown>
  isVhdDifferencing?: Record<string, boolean>
  size?: number
  jobId: string
  scheduleId: string
  timestamp: number
}
export const DEFAULT_MERGE_CONCURRENCY = 1
export const DEFAULT_REMOVE_CONCURRENCY = 4

export interface BackupCleanOptions {
  fix?: boolean
  merge?: boolean
  remove?: boolean
  mergeBlockConcurrency?: number
  onProgress?: (progress: { total: number; done: number }) => void
  logInfo?: (message: any, opts?: object) => void
  logWarn?: (message: any, opts?: object) => void
}

export type ResolvedBackupCleanOptions = BackupCleanOptions & {
  logInfo: (message: any, opts?: object) => void
  logWarn: (message: any, opts?: object) => void
}

export interface ArchiveCleanOptions {
  remove?: boolean
  merge?: boolean
}

export interface CheckResult {
  isValid: boolean
  // Files referenced by metadata but absent on disk
  missingDisks?: string[]
  // Files present on disk but not referenced by metadata
  orphans?: string[]
  // Files referenced by at least one valid backup
  linked?: string[]
}

export type CleanResult = {
  removedFiles: string[]
  merge: boolean
}

export interface VmBackupInterface {
  handler: RemoteHandlerAbstract
  // metadataPath: string
  // metadata: PartialBackupMetadata
  rootPath: string
  opts: BackupCleanOptions

  init(): Promise<void>
  check(): Promise<CheckResult>
  clean(opts?: ArchiveCleanOptions): Promise<CleanResult>
  getAssociatedFiles(opts: object): Array<string>
}
