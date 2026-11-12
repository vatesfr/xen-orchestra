import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'

export function useXo5VmRoute(rawVm: MaybeRefOrGetter<FrontXoVm>) {
  const vm = toComputed(rawVm)

  const { buildXo5Route } = useXoRoutes()

  const xo5VmGeneralHref = computed(() => buildXo5Route(`/vms/${vm.value.id}/general`))

  const xo5VmStatsHref = computed(() => buildXo5Route(`/vms/${vm.value.id}/stats`))

  const xo5VmAdvancedHref = computed(() => buildXo5Route(`/vms/${vm.value.id}/advanced`))

  return { xo5VmGeneralHref, xo5VmStatsHref, xo5VmAdvancedHref }
}
