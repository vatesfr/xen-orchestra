import { useClipboard } from '@vueuse/core'
import type { MaybeRefOrGetter } from 'vue'

export function useCopyToClipboard(source: MaybeRefOrGetter<string>) {
  return useClipboard({ source, legacy: true })
}
