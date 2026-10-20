import { useXoBackupJobTypeLabels } from '@/modules/backup-job/composables/use-xo-backup-job-type-labels.composable.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { createMetadataBackupJob, createMirrorBackupJob, createVmBackupJob } from '@/test/create-backup-job.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import type { XoBackupRepository, XoSchedule, XoSr } from '@vates/types'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const scheduleId = 'schedule-1' as XoSchedule['id']

function mountTypeLabels(backupJob: FrontAnyXoBackupJob) {
  return mountComposable(() => {
    const { t } = useI18n()

    return { typeLabels: useXoBackupJobTypeLabels(backupJob), t }
  }).wrapper.vm
}

describe('useXoBackupJobTypeLabels', () => {
  describe('VM backup job', () => {
    it('labels a job backing up to a backup repository as a VMs backup', () => {
      const result = mountTypeLabels(createVmBackupJob())

      expect(result.typeLabels).toEqual([result.t('backup:vms-backup')])
    })

    it('labels a job replicating to a storage repository as a VMs replication', () => {
      const result = mountTypeLabels(createVmBackupJob({ remotes: undefined, srs: { id: 'sr-123' as XoSr['id'] } }))

      expect(result.typeLabels).toEqual([result.t('backup:vms-replication')])
    })

    it('labels a job keeping snapshots as a rolling snapshot', () => {
      const result = mountTypeLabels(
        createVmBackupJob({ remotes: undefined, settings: { '': {}, [scheduleId]: { snapshotRetention: 2 } } })
      )

      expect(result.typeLabels).toEqual([result.t('backup:rolling-snapshot')])
    })

    it('lists every type of a job combining them, rolling snapshot first', () => {
      const result = mountTypeLabels(
        createVmBackupJob({
          srs: { id: 'sr-123' as XoSr['id'] },
          settings: { '': {}, [scheduleId]: { snapshotRetention: 1 } },
        })
      )

      expect(result.typeLabels).toEqual([
        result.t('backup:rolling-snapshot'),
        result.t('backup:vms-backup'),
        result.t('backup:vms-replication'),
      ])
    })

    it('ignores the targets emptied when their mode was disabled', () => {
      const result = mountTypeLabels(
        createVmBackupJob({
          remotes: { id: { __or: [] as XoBackupRepository['id'][] } },
          srs: { id: { __or: [] as XoSr['id'][] } },
          settings: { '': {}, [scheduleId]: { snapshotRetention: 0 } },
        })
      )

      expect(result.typeLabels).toEqual([])
    })
  })

  describe('metadata backup job', () => {
    it('labels a job backing up the pool metadata and the XO config as both', () => {
      const result = mountTypeLabels(createMetadataBackupJob())

      expect(result.typeLabels).toEqual([result.t('backup:pool-metadata'), result.t('backup:xo-config')])
    })

    it('labels a job backing up only the XO config as an XO config', () => {
      const result = mountTypeLabels(createMetadataBackupJob({ pools: undefined }))

      expect(result.typeLabels).toEqual([result.t('backup:xo-config')])
    })

    it('labels a job backing up only the pool metadata as a pool metadata', () => {
      const result = mountTypeLabels(createMetadataBackupJob({ xoMetadata: false }))

      expect(result.typeLabels).toEqual([result.t('backup:pool-metadata')])
    })
  })

  it('labels a mirror job as a VMs mirror', () => {
    const result = mountTypeLabels(createMirrorBackupJob())

    expect(result.typeLabels).toEqual([result.t('backup:vms-mirror')])
  })

  it('reacts to changes of the backup job', () => {
    const backupJob = ref<FrontAnyXoBackupJob>(createVmBackupJob())
    const { wrapper } = mountComposable(() => {
      const { t } = useI18n()

      return { typeLabels: useXoBackupJobTypeLabels(backupJob), t }
    })

    backupJob.value = createMirrorBackupJob()

    expect(wrapper.vm.typeLabels).toEqual([wrapper.vm.t('backup:vms-mirror')])
  })
})
