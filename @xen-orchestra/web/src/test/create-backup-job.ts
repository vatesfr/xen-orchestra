import type {
  FrontXoMetadataBackupJob,
  FrontXoMirrorBackupJob,
  FrontXoVmBackupJob,
} from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import type { XoBackupRepository, XoPool, XoVm } from '@vates/types'

export function createVmBackupJob(overrides: Partial<FrontXoVmBackupJob> = {}): FrontXoVmBackupJob {
  return {
    id: 'backup-job-123' as FrontXoVmBackupJob['id'],
    name: 'VM backup job',
    type: 'backup',
    mode: 'full',
    settings: { '': {} },
    remotes: { id: 'br-123' as XoBackupRepository['id'] },
    vms: { id: 'vm-123' as XoVm['id'] },
    compression: '',
    ...overrides,
  }
}

export function createMetadataBackupJob(overrides: Partial<FrontXoMetadataBackupJob> = {}): FrontXoMetadataBackupJob {
  return {
    id: 'backup-job-456' as FrontXoMetadataBackupJob['id'],
    name: 'Metadata backup job',
    type: 'metadataBackup',
    settings: { '': {} },
    remotes: { id: 'br-123' as XoBackupRepository['id'] },
    pools: { id: 'pool-123' as XoPool['id'] },
    xoMetadata: true,
    ...overrides,
  }
}

export function createMirrorBackupJob(overrides: Partial<FrontXoMirrorBackupJob> = {}): FrontXoMirrorBackupJob {
  return {
    id: 'backup-job-789' as FrontXoMirrorBackupJob['id'],
    name: 'Mirror backup job',
    type: 'mirrorBackup',
    mode: 'delta',
    settings: { '': { reportWhen: 'failure' } },
    sourceRemote: 'br-123' as XoBackupRepository['id'],
    remotes: { id: 'br-456' as XoBackupRepository['id'] },
    ...overrides,
  }
}
