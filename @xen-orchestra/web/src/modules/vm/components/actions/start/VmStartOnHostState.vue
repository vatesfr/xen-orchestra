<template>
  <div class="wrapper">
    <VtsIcon :name="hostIcon" :tooltip="hostIconTooltip" size="medium" />
    {{ host.name_label }}
    <VtsIcon v-if="isMasterHost(host.id)" name="status:primary-circle" size="medium" />
  </div>
</template>

<script setup lang="ts">
import { useXoHostOperationLabel } from '@/modules/host/composables/xo-host-operation-label.composable.ts'
import { type FrontXoHost, useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { getHostIcon } from '@/modules/host/utils/xo-host.util.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { computed } from 'vue'

const { host } = defineProps<{
  host: FrontXoHost
}>()

const { isMasterHost } = useXoHostCollection()
const { getHostIconTooltip } = useXoHostOperationLabel()

const hostIcon = computed(() => getHostIcon(host))
const hostIconTooltip = computed(() => getHostIconTooltip(host))
</script>

<style scoped lang="postcss">
.wrapper {
  display: flex;
  gap: 0.8rem;
  align-items: center;
}
</style>
