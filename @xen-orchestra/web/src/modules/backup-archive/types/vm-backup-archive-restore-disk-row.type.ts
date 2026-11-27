import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'

export type VmBackupArchiveRestoreDiskAction = 'copy' | 'read-write' | 'read-only' | 'skip'

export type VmBackupArchiveRestoreDiskRow = {
  id: string
  name: string
  size: number | undefined
  action: VmBackupArchiveRestoreDiskAction
  srId: FrontXoSr['id'] | undefined
  note: string | undefined
  srError: string | undefined
}

export type VmBackupArchiveRestoreDiskActionOption = {
  value: VmBackupArchiveRestoreDiskAction
  label: string
}
