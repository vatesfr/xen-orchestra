import { useXoBackupJobModeLabel } from '@/modules/backup-job/composables/use-xo-backup-job-mode-label.composable.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { createMetadataBackupJob, createMirrorBackupJob, createVmBackupJob } from '@/test/create-backup-job.ts'
import { mountComposableWithI18n } from '@/test/mount-composable.ts'
import { type MaybeRefOrGetter, ref } from 'vue'

function mountModeLabel(backupJob: MaybeRefOrGetter<FrontAnyXoBackupJob>) {
  return mountComposableWithI18n(() => ({ modeLabel: useXoBackupJobModeLabel(backupJob) }))
}

describe('useXoBackupJobModeLabel', () => {
  it('labels a full VM backup job as full', () => {
    const result = mountModeLabel(createVmBackupJob({ mode: 'full' }))

    expect(result.modeLabel).toBe(result.t('full'))
  })

  it('labels a delta VM backup job as incremental', () => {
    const result = mountModeLabel(createVmBackupJob({ mode: 'delta' }))

    expect(result.modeLabel).toBe(result.t('incremental'))
  })

  it('labels a mirror job after its mode', () => {
    const full = mountModeLabel(createMirrorBackupJob({ mode: 'full' }))
    const delta = mountModeLabel(createMirrorBackupJob({ mode: 'delta' }))

    expect(full.modeLabel).toBe(full.t('full'))
    expect(delta.modeLabel).toBe(delta.t('incremental'))
  })

  it('has no mode for a metadata job', () => {
    expect(mountModeLabel(createMetadataBackupJob()).modeLabel).toBe('')
  })

  it('reacts to changes of the backup job', () => {
    const backupJob = ref<FrontAnyXoBackupJob>(createVmBackupJob({ mode: 'full' }))
    const result = mountModeLabel(backupJob)

    backupJob.value = createVmBackupJob({ mode: 'delta' })

    expect(result.modeLabel).toBe(result.t('incremental'))
  })
})
