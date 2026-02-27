import { RemoteDisk } from '@xen-orchestra/backups'
import RemoteHandlerAbstract from '@xen-orchestra/fs'

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

export interface BackupCleanOptions {
  fix: boolean
  merge: boolean
  remove: boolean
  logInfo: (message: any, opts?: object) => void
  logWarn: (message: any, opts?: object) => void
}

export interface IBackupLineage {
  init(): Promise<void>
  check(): Promise<void>
  clean(): Promise<Set<string>>

  getOrphanDisks(): Set<string>
  getLinkedBackups(): Map<string, RemoteDisk>
}

export interface IVmBackupInterface {
  handler: RemoteHandlerAbstract
  // metadataPath: string
  // metadata: PartialBackupMetadata
  rootPath: string
  opts: BackupCleanOptions

  init(): Promise<void>
  check(): Promise<object>
  clean(opts?: object): Promise<Array<string>>
  getValidFiles(opts: object): Array<string>
}
