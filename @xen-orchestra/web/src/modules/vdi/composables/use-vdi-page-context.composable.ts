import { VDI_PAGE_CONTEXT, type VdiPageContext } from '@/shared/constants.ts'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

export function useVdiPageContext(fromContext: MaybeRefOrGetter<VdiPageContext | undefined>) {
  const isFromVm = computed(() => toValue(fromContext) === VDI_PAGE_CONTEXT.VM)

  const isFromSr = computed(() => toValue(fromContext) === VDI_PAGE_CONTEXT.SR)

  const isFromSnapshot = computed(() => toValue(fromContext) === VDI_PAGE_CONTEXT.SNAPSHOT)

  const isFromVdiSnapshot = computed(() => toValue(fromContext) === VDI_PAGE_CONTEXT.VDI_SNAPSHOT)

  return { isFromVm, isFromSr, isFromSnapshot, isFromVdiSnapshot }
}
