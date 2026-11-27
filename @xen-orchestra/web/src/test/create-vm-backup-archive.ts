import type { FrontXoVmBackupArchive } from '@/modules/backup-archive/remote-resources/use-xo-vm-backup-archive-collection.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import type { XoVmBackupJob } from '@vates/types'

/**
 * Builds a fully-populated `FrontXoVmBackupArchive` for use in tests. Pass `overrides` to
 * tweak only the fields relevant to the case under test.
 */
export function createVmBackupArchive(overrides: Partial<FrontXoVmBackupArchive> = {}): FrontXoVmBackupArchive {
  return {
    id: 'vm-backup-archive-123' as FrontXoVmBackupArchive['id'],
    type: 'xo-vm-backup',
    backupRepository: 'backup-repository-123' as FrontXoBackupRepository['id'],
    disks: [],
    isImmutable: false,
    jobId: 'backup-job-456' as XoVmBackupJob['id'],
    mode: 'delta',
    size: 1_073_741_824,
    tags: [],
    timestamp: 1_700_000_000_000,
    vm: {
      uuid: 'vm-1' as FrontXoVmBackupArchive['vm']['uuid'],
      name_description: '',
      name_label: 'Archived VM',
      tags: [],
    },
    ...overrides,
  }
}
