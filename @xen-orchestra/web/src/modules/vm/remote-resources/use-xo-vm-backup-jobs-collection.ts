import {
  anyBackupJobFields,
  type FrontXoVmBackupJob,
} from '@/modules/backup/remote-resources/use-xo-backup-job-collection.ts'
import { useXoVmCollection, type FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { vmContainsNoBakTag } from '@/modules/vm/utils/xo-vm.util.ts'
import { useWatchCollection } from '@/shared/composables/watch-collection.composable.ts'
import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { useOncePerScope, waitForCollection } from '@core/packages/remote-resource/utils/remote-resource.util.ts'
import { useSorted } from '@vueuse/core'
import { extractIdsFromSimplePattern } from '@xen-orchestra/backups/extractIdsFromSimplePattern.mjs'
import { isEqual } from 'lodash-es'
import { createPredicate } from 'value-matcher'
import { toValue, watch } from 'vue'

export const useXoVmBackupJobCollection = defineRemoteResource({
  url: (vmId: FrontXoVm['id']) =>
    `${BASE_URL}/vms/${vmId}/backup-jobs?fields=${anyBackupJobFields.join(',')}&ndjson=true`,
  stream: true,
  initWatchCollection: () =>
    useWatchCollection<FrontXoVmBackupJob>({
      collectionId: 'vmBackupJob',
      resource: 'backup-job',
      // same fields as the global collection: the SSE subscription is shared per resource (last POST wins)
      fields: anyBackupJobFields,
      async predicate(obj, context) {
        if (context === undefined || context.args === undefined || Array.isArray(obj)) {
          return true
        }

        const [id] = context.args
        const vmId = toValue(id)

        const { getVmById } = await waitForCollection(useOncePerScope(useXoVmCollection, context))

        const vm = getVmById(vmId)
        if (vm === undefined || vmContainsNoBakTag(vm)) {
          return false
        }
        try {
          const vmIds = extractIdsFromSimplePattern<FrontXoVm['id']>(obj.vms)
          return vmIds.some(id => id === vmId)
        } catch (error) {
          const predicate = createPredicate(obj.vms)
          return predicate(vm)
        }
      },
    }),
  initialData: () => [] as FrontXoVmBackupJob[],
  state: (rawBackupJobs, context) => {
    const { useGetVmById } = useOncePerScope(useXoVmCollection, context)
    const vm = useGetVmById(() => toValue(context.args[0]))

    // smart mode patterns and `xo:no-bak` tag depend on VM fields, but changing them doesn't emit any backup-job event
    watch(
      () => vm.value && [vm.value.tags, vm.value.$pool, vm.value.power_state],
      (value, oldValue) => {
        if (oldValue !== undefined && !isEqual(value, oldValue)) {
          context.forceReload()
        }
      }
    )

    const backupJobs = useSorted(rawBackupJobs, ({ name: name1 = '' }, { name: name2 = '' }) =>
      name1.localeCompare(name2)
    )

    return {
      ...useXoCollectionState(backupJobs, {
        context,
        baseName: 'vmBackupJob',
      }),
    }
  },
})
