<template>
  <slot v-if="uiStore.isDesktop || disabled" />
  <Teleport v-else-if="isOpen" to="body">
    <div class="mobile-fullscreen">
      <MobileHeadBar @close="emit('close')">
        <slot name="header" />
      </MobileHeadBar>
      <slot />
    </div>
  </Teleport>
</template>

<script lang="ts" setup>
import MobileHeadBar from '@core/components/mobile-fullscreen/MobileHeadBar.vue'
import { useUiStore } from '@core/stores/ui.store'

defineProps<{
  disabled?: boolean
  isOpen?: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const uiStore = useUiStore()
</script>

<style lang="postcss" scoped>
.mobile-fullscreen {
  background-color: var(--background-color-secondary);
  position: fixed;
  inset: 0;
  z-index: 100;
}
</style>
