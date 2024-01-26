<template>
  <FontAwesomeLayers>
    <UiIcon :icon="faDisplay" />
    <PowerStateIcon :state="state" />
  </FontAwesomeLayers>
</template>

<script lang="ts" setup>
import PowerStateIcon from '@core/components/PowerStateIcon.vue'
import UiIcon from '@core/components/ui/icon/UiIcon.vue'
import type { VM_POWER_STATE } from '@core/utils/xen-api/xen-api.enums'
import { faDisplay } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeLayers } from '@fortawesome/vue-fontawesome'

defineProps<{
  state: VM_POWER_STATE
}>()
</script>

<style lang="postcss" scoped>
.fa-layers {
  flex-shrink: 0;
}

.power-state-icon {
  font-size: 0.7em;
  transform: translate(80%, 70%);
}
</style>
