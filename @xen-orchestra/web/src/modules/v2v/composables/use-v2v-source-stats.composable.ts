import { countV2vImportsBySource } from '@/modules/v2v/utils/v2v-import-markers.util.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

export function useV2vSourceStats(sourceId: MaybeRefOrGetter<string | undefined>) {
  const { vms, areVmsReady } = useXoVmCollection()

  return computed(() => {
    const id = toValue(sourceId)

    if (id === undefined || !areVmsReady.value) {
      return undefined
    }

    return countV2vImportsBySource(vms.value, id)
  })
}
