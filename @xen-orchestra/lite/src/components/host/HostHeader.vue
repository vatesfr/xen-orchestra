<template>
  <UiHeadBar>
    <template #icon>
      <UiObjectIcon size="medium" type="host" :state="powerState as HostState" />
    </template>
    {{ host.name_label }}
    <template v-if="isMaster" #status>
      <VtsIcon v-tooltip="$t('master')" accent="info" :icon="faCircle" :overlay-icon="faStar" />
    </template>
  </UiHeadBar>
</template>

<script lang="ts" setup>
import type { XenApiHost } from '@/libs/xen-api/xen-api.types'
import { useHostMetricsStore } from '@/stores/xen-api/host-metrics.store'
import { usePoolStore } from '@/stores/xen-api/pool.store'
import type { HostState } from '@core/types/object-icon.type'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiObjectIcon from '@core/components/ui/object-icon/UiObjectIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { faCircle, faStar } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

const { host } = defineProps<{
  host: XenApiHost
}>()

const { isHostRunning } = useHostMetricsStore().subscribe()

const powerState = computed(() => (isHostRunning(host) ? 'running' : 'halted'))

const { isMasterHost } = usePoolStore().subscribe()
const isMaster = computed(() => isMasterHost(host.$ref))
</script>
