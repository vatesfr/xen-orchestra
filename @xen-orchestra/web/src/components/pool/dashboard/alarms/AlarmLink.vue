<template>
  <div class="alarm-link">
    <UiLink size="small" :to="route" :icon>
      {{ nameLabel }}
    </UiLink>
  </div>
</template>

<script setup lang="ts">
import { useHostStore } from '@/stores/xo-rest-api/host.store.ts'
import { useSrStore } from '@/stores/xo-rest-api/sr.store.ts'
import { useVmControllerStore } from '@/stores/xo-rest-api/vm-controller.store.ts'
import { useVmStore } from '@/stores/xo-rest-api/vm.store.ts'
import type { XoVmController } from '@/types/xo/vm-controller.type.ts'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { faDatabase, faDesktop, faServer } from '@fortawesome/free-solid-svg-icons'
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
    return hostRecords.value.find(host => host.id === uuid)
  }

  if (type === 'VM-controller') {
    return vmControllerRecords.value.find(vmController => vmController.id === uuid)
  }

  if (type === 'SR') {
    return srRecords.value.find(sr => sr.id === uuid)
  }

  return undefined
})

const nameLabel = computed(() => record.value?.name_label ?? uuid)

const icon = computed(() => {
  if (type === 'VM' || type === 'VM-controller') {
    return faDesktop
  }

  if (type === 'host') {
    return faServer
  }

  if (type === 'SR') {
    return faDatabase
  }

  return undefined
})

const route = computed(() => {
  if (!record.value) {
    return undefined
  }

  if (type === 'VM-controller') {
    return `/host/${(record.value as XoVmController).$container}`
  }

  return `/${type}/${uuid}`
})
</script>

<style lang="postcss" scoped>
.alarm-link {
  align-items: center;
  line-height: 1;
}
</style>
