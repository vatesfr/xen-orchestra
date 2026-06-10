<template>
  <div class="vts-code-snippet">
    <div v-tooltip="{ placement: 'bottom' }" class="content text-ellipsis">
      <slot>
        {{ content }}
      </slot>
    </div>
    <div v-if="copy || slots.addons" class="addons">
      <slot name="addons">
        <VtsCopyButton v-if="copy && content" :value="String(content)" />
      </slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'

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
  font-size: 1.4rem;
  display: flex;
  align-items: center;
  gap: 0.8rem;

  .content {
    color: var(--color-neutral-txt-primary);
    font-family: 'Courier New', Courier, monospace;
  }

  .addons {
    margin-inline-start: auto;
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }
}
</style>
