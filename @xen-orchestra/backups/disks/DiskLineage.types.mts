import { RemoteDisk } from './RemoteDisk.mjs'

export type AnomalyReport = {
  multipleChildren: Array<string>
  brokenChains: Array<string>
  incompleteChains: Array<string>
}

export interface PartialBackupMetadata {
  mode: 'full' | 'delta'
  xva?: string
  vhds?: Record<string, string>
}

export interface IBackupLineage {
  init(): Promise<void>
  check(): Promise<void>
  clean(): Promise<Set<string>>

  getOrphanDisks(): Set<string>
  getLinkedBackups(): Map<string, RemoteDisk>
}
