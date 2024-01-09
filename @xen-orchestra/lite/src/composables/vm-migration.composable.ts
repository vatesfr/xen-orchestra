import { sortRecordsByNameLabel } from '@/libs/utils'
import { VM_OPERATION } from '@/libs/xen-api/xen-api.enums'
import type { XenApiHost, XenApiVm } from '@/libs/xen-api/xen-api.types'
import { useXenApiStore } from '@/stores/xen-api.store'
import { useHostCollection } from '@/stores/xen-api/host.store'
import { useVmCollection } from '@/stores/xen-api/vm.store'
import { castArray } from 'lodash-es'
import type { MaybeRefOrGetter } from 'vue'
import { computed, ref, toValue } from 'vue'

export const useVmMigration = (vmRefs: MaybeRefOrGetter<XenApiVm['$ref'] | XenApiVm['$ref'][]>) => {
  const $isMigrating = ref(false)
  const selectedHost = ref<XenApiHost>()
  const { getByOpaqueRef: getVm } = useVmCollection()
  const { records: hosts } = useHostCollection()

  const vms = computed(
    () =>
      castArray(toValue(vmRefs))
        .map(vmRef => getVm(vmRef))
        .filter(vm => vm !== undefined) as XenApiVm[]
  )

  const isMigrating = computed(
    () =>
      $isMigrating.value ||
      vms.value.some(vm =>
        Object.values(vm.current_operations).some(operation => operation === VM_OPERATION.POOL_MIGRATE)
      )
  )

  const availableHosts = computed(() => {
    return hosts.value.filter(host => vms.value.some(vm => vm.resident_on !== host.$ref)).sort(sortRecordsByNameLabel)
  })

  const isValid = computed(() => !isMigrating.value && vms.value.length > 0 && selectedHost.value !== undefined)

  const migrate = async () => {
    if (!isValid.value) {
      return
    }

    try {
      $isMigrating.value = true
      const hostRef = selectedHost.value!.$ref
      const xapi = useXenApiStore().getXapi()

      await xapi.vm.migrate(
        vms.value.map(vm => vm.$ref),
        hostRef
      )
    } finally {
      $isMigrating.value = false
    }
  }

  return {
    isMigrating,
    availableHosts,
    selectedHost,
    isValid,
    migrate,
  }
}
