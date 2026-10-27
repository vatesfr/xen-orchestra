import { useXoBackupLogCollection } from '@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { computed } from 'vue'

export function useVmLastBackupDates() {
  const { backupLogs, areBackupLogsReady } = useXoBackupLogCollection()

  const lastBackupDateByVmId = computed(() => {
    const dates = new Map<FrontXoVm['id'], number>()

    for (const backupLog of backupLogs.value) {
      for (const task of backupLog.tasks ?? []) {
        if (task.data?.type !== 'VM' || task.status !== 'success') {
          continue
        }

        const vmId = task.data.id as FrontXoVm['id']

        dates.set(vmId, Math.max(dates.get(vmId) ?? 0, task.start))
      }
    }

    return dates
  })

  function getVmLastBackupDate(vmId: FrontXoVm['id']) {
    return lastBackupDateByVmId.value.get(vmId)
  }

  return {
    getVmLastBackupDate,
    areBackupLogsReady,
  }
}
