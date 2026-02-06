<template>
  <div class="vts-code-snippet">
    <slot>
      {{ content }}
    </slot>
    <div v-if="copy || slots.addons" class="addons">
      <slot name="addons">
        <VtsCopyButton v-if="copy && content" :value="String(content)" />
      </slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'

defineProps<{
  content?: string | number
  copy?: boolean
}>()

const slots = defineSlots<{
  default?(): any
  addons?(): any
}>()
</script>

<style lang="postcss" scoped>
.vts-code-snippet {
  font-family: 'Courier New', Courier, monospace;
  font-size: 1.4rem;
  color: var(--color-neutral-txt-primary);
  display: flex;
  align-items: center;
  gap: 0.8rem;

  .addons {
    margin-inline-start: auto;
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }
}
</style>
