import { Disk } from '@xen-orchestra/disk-transform'
import { RemoteHandlerAbstract } from '@xen-orchestra/fs'

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
  // 'true' when written by code including the non-NBD qcow2 corruption fix and its force-full
  // gate; its absence marks a potentially-corrupt older backup and makes the gate re-probe.
  // Preserved (never stamped) across merges here.
  // @todo remove this code and the logic associated on 2027 01 01
  includeNonNbdQcow2Fix?: boolean
}

// A VDI entry of a backup metadata. `baseVdi` is only meaningful while a backup runs and is
// stripped before an import.
export interface BackupVdi {
  uuid: string
  baseVdi?: string
  [key: string]: unknown
}

// A VM backup metadata file as read from a remote by `readVmBackupMetadata`: the on-disk
// JSON, plus the fields injected while reading it.
export interface StoredBackupMetadata extends PartialBackupMetadata {
  // path of the metadata file, used to compute the backup id
  //
  // it's enumerable to make it cacheable
  _filename: string
  id?: string
  isImmutable?: boolean
  vdis?: Record<string, BackupVdi>
  // XAPI records, too heterogeneous to type here
  vm: Record<string, unknown> & { is_a_template: boolean | number }
  vmSnapshot?: Record<string, unknown>
  vbds?: Record<string, unknown>
  vifs?: Record<string, unknown>
  vtpms?: unknown
}

// What `readIncrementalVmBackup` hands to an import: one open disk per VDI ref, plus the
// XAPI records needed to recreate the VM.
export interface IncrementalImportPayload {
  disks: Record<string, Disk>
  vbds?: Record<string, unknown>
  vdis: Record<string, BackupVdi>
  version: '1.0.0'
  vifs?: Record<string, unknown>
  vm: Record<string, unknown>
  vtpms?: unknown
}

// Anything `computeTotalBackupSizeRecursively` can sum: backups report either an already
// aggregated `onDisk` size or a raw `size`.
export interface SizedBackups {
  onDisk?: number
  size?: number
}

// Read-modify-write of a single cache file. Injected by callers so they keep ownership of
// locking: the implementation passed here is expected to be serialized per path.
export type UpdateCache = (path: string, fn: (cache: Record<string, unknown>) => void) => Promise<void>

export const DEFAULT_MERGE_CONCURRENCY = 1
export const DEFAULT_REMOVE_CONCURRENCY = 4

export interface BackupCleanOptions {
  fix?: boolean
  merge?: boolean
  remove?: boolean
  mergeBlockConcurrency?: number
  mergeConcurrency?: number
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
  mergedSizes?: Map<string, number>
}

export interface CheckResult {
  isValid: boolean
  // Files referenced by metadata but absent on disk
  missingDisks?: string[]
  // Disk files that exist but failed to open (corrupted)
  brokenDisks?: string[]
  // Files present on disk but not referenced by metadata
  orphans?: string[]
  // Files referenced by at least one valid backup
  linked?: string[]
}

export type CleanResult = {
  removedFiles: string[]
  merge?: boolean
  size?: number
  mergedSizes?: Map<string, number>
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
