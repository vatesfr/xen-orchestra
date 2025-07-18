<template>
  <div class="alarm-link">
    <UiObjectLink :route>
      <template #icon>
        <UiObjectIcon :type="iconType" size="medium" :state="powerState" />
      </template>
      {{ nameLabel }}
    </UiObjectLink>
  </div>
</template>

<script setup lang="ts">
import { useHostStore } from '@/stores/xo-rest-api/host.store.ts'
import { useSrStore } from '@/stores/xo-rest-api/sr.store.ts'
import { useVmControllerStore } from '@/stores/xo-rest-api/vm-controller.store.ts'
import { useVmStore } from '@/stores/xo-rest-api/vm.store.ts'
import UiObjectIcon from '@core/components/ui/object-icon/UiObjectIcon.vue'
import UiObjectLink from '@core/components/ui/object-link/UiObjectLink.vue'
import type { XapiXoRecord } from '@vates/types'
import { computed } from 'vue'

const { type, uuid } = defineProps<{
  type: XapiXoRecord['type'] | 'unknown'
  uuid: XapiXoRecord['uuid']
}>()

const { records: hostRecords } = useHostStore().subscribe()
const { records: vmRecords } = useVmStore().subscribe()
const { records: vmControllerRecords } = useVmControllerStore().subscribe()
const { records: srRecords } = useSrStore().subscribe()

const record = computed(() => {
  if (type === 'VM') {
    return vmRecords.value.find(vm => vm.id === uuid)
  }
  if (type === 'host') {
    return hostRecords.value.find(vm => vm.id === uuid)
  }
  if (type === 'VM-controller') {
    return vmControllerRecords.value.find(vm => vm.id === uuid)
  }
  if (type === 'SR') {
    return srRecords.value.find(vm => vm.id === uuid)
  }
  return undefined
})

const nameLabel = computed(() => record.value?.name_label ?? uuid)

const iconType = computed(() => {
  if (type === 'VM' || type === 'VM-controller') {
    return 'vm'
  }
  if (type === 'host') {
    return 'host'
  }
  return 'vm'
})

const powerState = computed(() => record.value?.power_state.toLowerCase() ?? 'unknown')

const route = computed(() => {
  return type === 'VM-controller' ? `/host/${record?.value?.$container}` : `/${type}/${uuid}`
})
</script>
