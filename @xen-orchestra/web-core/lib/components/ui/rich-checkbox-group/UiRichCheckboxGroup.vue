<!-- v1 -->
<template>
  <div class="ui-rich-checkbox-group">
    <div v-if="slots.label || label !== undefined" :id="labelId">
      <slot name="label">
        <UiLabel :accent="labelAccent">
          {{ label }}
        </UiLabel>
      </slot>
    </div>
    <div
      :aria-labelledby="slots.label || label !== undefined ? labelId : undefined"
      :class="{ vertical }"
      class="group"
      role="group"
    >
      <slot />
    </div>
    <slot v-if="slots.info || info !== undefined" name="info">
      <UiInfo accent="info">
        {{ info }}
      </UiInfo>
    </slot>
    <slot v-if="accent !== 'brand' && (slots.message || message !== undefined)" name="message">
      <UiInfo :accent>
        {{ message }}
      </UiInfo>
    </slot>
  </div>
</template>

<script setup lang="ts">
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLabel from '@core/components/ui/label/UiLabel.vue'
import type { RichCheckboxAccent } from '@core/components/ui/rich-checkbox/UiRichCheckbox.vue'
import { computed, useId } from 'vue'

const { accent } = defineProps<{
  accent: RichCheckboxAccent
  label?: string
  info?: string
  message?: string
  vertical?: boolean
}>()

const slots = defineSlots<{
  default(): any
  label?(): any
  info?(): any
  message?(): any
}>()

const labelId = useId()

const labelAccent = computed(() => (accent === 'brand' ? 'neutral' : accent))
</script>

<style scoped lang="postcss">
.ui-rich-checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;

  .group {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: minmax(0, 1fr);
    gap: 0.8rem;

    &.vertical {
      grid-auto-flow: row;
    }
  }
}
</style>
