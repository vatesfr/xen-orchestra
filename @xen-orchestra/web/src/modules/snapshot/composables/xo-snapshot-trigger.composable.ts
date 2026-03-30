import { useXoBackupJobCollection } from '@/modules/backup/remote-resources/use-xo-backup-job-collection.ts'
import {
  type FrontXoSchedule,
  useXoScheduleCollection,
} from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import type { FrontXoVmSnapshot } from '@/modules/snapshot/components/remote-resources/use-xo-vm-snapshot-collection.ts'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import { icon } from '@core/icons'
import { useI18n } from 'vue-i18n'

export function useSnapshotTrigger() {
  const { t } = useI18n()

  const { getScheduleById } = useXoScheduleCollection()
  const { buildXo5Route } = useXoRoutes()
  const { getBackupJobById } = useXoBackupJobCollection()

  function getSnapshotTrigger(snapshot: FrontXoVmSnapshot) {
    const scheduleId = snapshot.other?.['xo:backup:schedule'] as FrontXoSchedule['id']

    if (!scheduleId) {
      return { label: t('manual') }
    }

    const schedule = getScheduleById(scheduleId)

    const href = buildXo5Route(`/backup/${schedule?.jobId}/edit`)

    const backupJob = getBackupJobById(schedule?.jobId)

    return {
      label: schedule?.name || t('unnamed'),
      href,
      icon: icon('object:backup-schedule'),
      suffix: backupJob?.name,
    }
  }

  return { getSnapshotTrigger }
}
