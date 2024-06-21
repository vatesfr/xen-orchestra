<!-- v1.0 -->
<template>
  <FontAwesomeLayers class="vm-icon">
    <UiIcon :icon="faDisplay" />
    <PowerStateIcon :state class="state" />
  </FontAwesomeLayers>
</template>

<script lang="ts" setup>
import UiIcon from '@core/components/icon/UiIcon.vue'
import PowerStateIcon from '@core/components/PowerStateIcon.vue'
import type { POWER_STATE } from '@core/types/power-state.type'
import { faDisplay } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeLayers } from '@fortawesome/vue-fontawesome'

defineProps<{
  state: POWER_STATE
}>()
</script>

<style lang="postcss" scoped>
.vm-icon {
  flex-shrink: 0;
}

.state {
  font-size: 0.7em;
  transform: translate(80%, 70%);
}
</style>
