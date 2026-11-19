import type { BackupLogTask } from '@/modules/backup-log/composables/use-xo-backup-log-utils.composable.ts'
import {
  type FrontXoBackupRepository,
  useXoBackupRepositoryCollection,
} from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import {
  type FrontXoSr,
  useXoSrCollection,
} from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { type FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { Task } from '@core/components/ui/task-item/UiTaskItem.vue'
import { useI18n } from 'vue-i18n'

export function useXoBackupLogTaskName() {
  const { t } = useI18n()

  const { getVmById } = useXoVmCollection()
  const { getSrById } = useXoSrCollection()
  const { getBackupRepositoryById } = useXoBackupRepositoryCollection()

  function getTaskName(task: BackupLogTask): Pick<Task, 'name' | 'to'> {
    const id = task.data?.id

    switch (task.data?.type) {
      case 'VM': {
        const vm = getVmById(id as FrontXoVm['id'])

        return vm !== undefined
          ? { name: vm.name_label, to: { name: '/vm/[id]/dashboard', params: { id: vm.id } } }
          : { name: task.data.name_label ?? id }
      }
      case 'SR': {
        const sr = getSrById(id as FrontXoSr['id'])

        return sr !== undefined ? { name: sr.name_label, to: { name: '/sr/[id]/general', params: { id: sr.id } } } : { name: id }
      }
      case 'remote': {
        const br = getBackupRepositoryById(id as FrontXoBackupRepository['id'])

        return br !== undefined
          ? { name: br.name, to: { name: '/admin/backup-repository/[id]/general', params: { id: br.id } } }
          : { name: id }
      }
    }

    switch (task.message) {
      case 'snapshot':
        return { name: t('snapshot') }
      case 'transfer':
        return { name: t('transfer') }
      case 'merge':
        return { name: t('merge') }
      case 'health check':
        return { name: t('health-check') }
      default:
        return { name: task.message }
    }
  }

  return { getTaskName }
}
