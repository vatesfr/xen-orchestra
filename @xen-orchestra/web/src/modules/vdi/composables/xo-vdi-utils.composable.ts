import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import { type IconName, objectIcon } from '@core/icons'
import { useArrayEvery } from '@vueuse/shared'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

export function useXoVdiUtils(rawVbds: MaybeRefOrGetter<FrontXoVbd[]>) {
  const vbds = computed(() => toValue(rawVbds))

  const areAllVbdsAttached = useArrayEvery(vbds, vbd => vbd.attached)

  const areAllVbdsDetached = useArrayEvery(vbds, vbd => !vbd.attached)

  const isVdiFreeForWriting = useArrayEvery(vbds, vbd => !vbd.attached || vbd.read_only)

  const vdiIcon = computed<IconName>(() => {
    if (vbds.value.length === 0 || areAllVbdsDetached.value) {
      return objectIcon('vdi', 'detached')
    }

    if (areAllVbdsAttached.value) {
      return objectIcon('vdi', 'attached')
    }

    return objectIcon('vdi', 'warning')
  })

  return {
    areAllVbdsAttached,
    areAllVbdsDetached,
    isVdiFreeForWriting,
    vdiIcon,
  }
}
