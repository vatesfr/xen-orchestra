<template>
  <UiHeadBar>
    <template #icon>
      <UiObjectIcon size="medium" type="host" :state="getHostPowerState as HostState" />
    </template>
    {{ host.name_label }}
  </UiHeadBar>
</template>

<script lang="ts" setup>
import type { XenApiHost } from '@/libs/xen-api/xen-api.types'
import { useHostStore } from '@/stores/xen-api/host.store'
import type { HostState } from '@core/types/object-icon.type'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiObjectIcon from '@core/components/ui/object-icon/UiObjectIcon.vue'
import { computed } from 'vue'

const props = defineProps<{
  host: XenApiHost
}>()
const { runningHosts } = useHostStore().subscribe()

const getHostPowerState = computed(() => {
  const isHostRunning = runningHosts.value.some(runningHost => runningHost.uuid === props.host.uuid)
  return isHostRunning ? 'running' : 'halted'
})
</script>
