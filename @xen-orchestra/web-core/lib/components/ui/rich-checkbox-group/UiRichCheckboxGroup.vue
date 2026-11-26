<!-- v1 -->
<template>
  <div class="ui-rich-checkbox-group">
    <div v-if="hasLabel" :id="labelId">
      <slot name="label">
        <UiLabel :accent="labelAccent">
          {{ label }}
        </UiLabel>
      </slot>
    </div>
    <div :aria-labelledby="hasLabel ? labelId : undefined" :class="{ vertical }" class="group" role="group">
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

const { accent, label } = defineProps<{
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

const hasLabel = computed(() => slots.label !== undefined || label !== undefined)

const labelAccent = computed(() => (accent === 'brand' ? 'neutral' : accent))
</script>

<style scoped lang="postcss">
.ui-rich-checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;

  .group {
    display: flex;
    flex-wrap: wrap;
    gap: 0.8rem;

    &.vertical {
      flex-direction: column;
    }
  }
}
</style>
