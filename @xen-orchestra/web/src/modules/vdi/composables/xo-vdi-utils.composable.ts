import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import { useArrayEvery } from '@vueuse/shared'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

export function useXoVdiUtils(rawVbds: MaybeRefOrGetter<FrontXoVbd[]>) {
  const vbds = computed(() => toValue(rawVbds))

  const isVdiFreeForWriting = useArrayEvery(vbds, vbd => !vbd.attached || vbd.read_only)

  return {
    isVdiFreeForWriting,
  }
}
