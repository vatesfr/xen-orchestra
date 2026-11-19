import { useXoBackupJobModeLabel } from '@/modules/backup-job/composables/use-xo-backup-job-mode-label.composable.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { createMetadataBackupJob, createMirrorBackupJob, createVmBackupJob } from '@/test/create-backup-job.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

function mountModeLabel(backupJob: FrontAnyXoBackupJob) {
  return mountComposable(() => {
    const { t } = useI18n()

    return { modeLabel: useXoBackupJobModeLabel(backupJob), t }
  }).wrapper.vm
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
    const { wrapper } = mountComposable(() => {
      const { t } = useI18n()

      return { modeLabel: useXoBackupJobModeLabel(backupJob), t }
    })

    backupJob.value = createVmBackupJob({ mode: 'delta' })

    expect(wrapper.vm.modeLabel).toBe(wrapper.vm.t('incremental'))
  })
})
