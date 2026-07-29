<template>
  <div class="wrapper">
    <VtsObjectIcon type="host" :state="getHostState(host)" size="medium" />
    {{ host.name_label }}
    <VtsIcon v-if="isMasterHost(host.id)" name="status:primary-circle" size="medium" />
  </div>
</template>

<script setup lang="ts">
import { type FrontXoHost, useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { getHostState } from '@/modules/host/utils/xo-host.util.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsObjectIcon from '@core/components/object-icon/VtsObjectIcon.vue'

const { host } = defineProps<{
  host: FrontXoHost
}>()
const { isMasterHost } = useXoHostCollection()
</script>

<style scoped lang="postcss">
.wrapper {
  display: flex;
  gap: 0.8rem;
  align-items: center;
}
</style>
