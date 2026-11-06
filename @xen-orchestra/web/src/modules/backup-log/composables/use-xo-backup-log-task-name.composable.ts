import type { BackupLogTask } from '@/modules/backup-log/composables/use-xo-backup-log-utils.composable.ts'
import {
  type FrontXoBackupRepository,
  useXoBackupRepositoryCollection,
} from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { getBackupRepositoryIcon } from '@/modules/backup-repository/utils/xo-backup-repository.util.ts'
import { useXoSrUtils } from '@/modules/storage-repository/composables/xo-sr-utils.composable.ts'
import {
  type FrontXoSr,
  useXoSrCollection,
} from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { type FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { Task } from '@core/components/ui/task-item/UiTaskItem.vue'
import { objectIcon } from '@core/icons'
import { toLower } from 'lodash-es'
import { useI18n } from 'vue-i18n'
import { parse as parseBackupRepositoryUrl } from 'xo-remote-parser'

export function useXoBackupLogTaskName() {
  const { t } = useI18n()

  const { getVmById } = useXoVmCollection()
  const { getSrById } = useXoSrCollection()
  const { getBackupRepositoryById } = useXoBackupRepositoryCollection()
  const { getSrStatusIcon } = useXoSrUtils()

  function getTaskName(task: BackupLogTask): Pick<Task, 'name' | 'icon' | 'to'> {
    const id = task.data?.id

    switch (task.data?.type) {
      case 'VM': {
        const vm = getVmById(id as FrontXoVm['id'])

        return vm !== undefined
          ? {
              name: vm.name_label,
              icon: objectIcon('vm', toLower(vm.power_state)),
              to: { name: '/vm/[id]/dashboard', params: { id: vm.id } },
            }
          : { name: task.data.name_label ?? id }
      }
      case 'SR': {
        const sr = getSrById(id as FrontXoSr['id'])

        return sr !== undefined
          ? { name: sr.name_label, icon: getSrStatusIcon(sr), to: { name: '/sr/[id]/general', params: { id: sr.id } } }
          : { name: id }
      }
      case 'remote': {
        const br = getBackupRepositoryById(id as FrontXoBackupRepository['id'])

        return br !== undefined
          ? {
              name: br.name,
              icon: getBackupRepositoryIcon(br, parseBackupRepositoryUrl(br.url).type),
              to: { name: '/admin/backup-repository/[id]/general', params: { id: br.id } },
            }
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
