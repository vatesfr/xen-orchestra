<template>
  <div class="wrapper">
    <VtsObjectIcon type="host" :state="hostPowerState" size="medium" />
    {{ host.name_label }}
    <VtsIcon v-if="isMasterHost(host.id)" name="legacy:primary" size="medium" />
  </div>
</template>

<script setup lang="ts">
import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsObjectIcon from '@core/components/object-icon/VtsObjectIcon.vue'
import { type XoHost } from '@vates/types'
import { toLower } from 'lodash-es'
import { computed } from 'vue'

const { host } = defineProps<{
  host: XoHost
}>()
const { isMasterHost } = useXoHostCollection()

const hostPowerState = computed(() => toLower(host.power_state))
</script>

<style scoped lang="postcss">
.wrapper {
  display: flex;
  gap: 0.8rem;
  align-items: center;
}
</style>
