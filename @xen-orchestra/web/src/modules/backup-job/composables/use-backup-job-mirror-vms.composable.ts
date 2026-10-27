import type { BackupJobMode } from '@/modules/backup-job/form/use-backup-job-source-form.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { useXoVmBackupArchiveCollection } from '@/modules/vm/remote-resources/use-xo-vm-backup-archive-collection.ts'
import { type FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { QueryBuilderPreviewItem } from '@core/components/query-builder/VtsQueryBuilderPreview.vue'
import { objectIcon } from '@core/icons'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { toLower } from 'lodash-es'
import { computed, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export type BackupJobMirrorVm = {
  id: FrontXoVm['id']
  name_label: string
  tags: string[]
  backupCount: number
  lastBackupDate: number
}

export function useBackupJobMirrorVms(
  rawBackupRepositoryId: MaybeRefOrGetter<FrontXoBackupRepository['id'] | undefined>,
  rawMode: MaybeRefOrGetter<BackupJobMode>,
  rawIsEnabled: MaybeRefOrGetter<boolean>
) {
  const { t } = useI18n()

  const backupRepositoryId = toComputed(rawBackupRepositoryId)
  const mode = toComputed(rawMode)
  const isEnabled = toComputed(rawIsEnabled)

  const { getVmById } = useXoVmCollection()

  const { backupArchives, areBackupArchivesReady } = useXoVmBackupArchiveCollection(
    { isEnabled: computed(() => isEnabled.value && backupRepositoryId.value !== undefined) },
    () => (backupRepositoryId.value !== undefined ? [backupRepositoryId.value] : [])
  )

  const mirrorVms = computed(() => {
    const vmsById = new Map<FrontXoVm['id'], BackupJobMirrorVm>()

    for (const archive of backupArchives.value) {
      if (archive.mode !== mode.value) {
        continue
      }

      const id = archive.vm.uuid as FrontXoVm['id']
      const mirrorVm = vmsById.get(id)

      if (mirrorVm === undefined) {
        vmsById.set(id, {
          id,
          name_label: archive.vm.name_label,
          tags: archive.vm.tags,
          backupCount: 1,
          lastBackupDate: archive.timestamp,
        })
      } else {
        mirrorVm.backupCount++
        mirrorVm.lastBackupDate = Math.max(mirrorVm.lastBackupDate, archive.timestamp)
      }
    }

    return [...vmsById.values()]
  })

  const mirrorVmSchema = useQueryBuilderSchema<BackupJobMirrorVm>({
    '': useStringSchema(t('any-property')),
    name_label: useStringSchema(t('name')),
    tags: useStringSchema(t('tags')),
  })

  function toPreviewItems(vms: BackupJobMirrorVm[]): QueryBuilderPreviewItem[] {
    return vms.map(mirrorVm => {
      const vm = getVmById(mirrorVm.id)

      return {
        id: mirrorVm.id,
        label: mirrorVm.name_label,
        icon: vm !== undefined ? objectIcon('vm', toLower(vm.power_state)) : 'object:vm:unknown',
        route: `/vm/${mirrorVm.id}/dashboard`,
      }
    })
  }

  return {
    mirrorVms,
    mirrorVmSchema,
    areMirrorVmsReady: areBackupArchivesReady,
    toPreviewItems,
  }
}
