<template>
  <div class="card-row-value-list">
    <div v-for="(value, index) in visibleValues" :key="index" class="value-row">
      <div class="value">{{ value }}</div>
      <div class="addons">
        <VtsCopyButton :value />
        <slot v-if="index === 0" name="first-row-addons" />
      </div>
    </div>
    <UiButton
      v-if="hiddenValuesCount > 0"
      class="see-more"
      size="small"
      accent="brand"
      variant="tertiary"
      @click="toggleExpanded()"
    >
      {{ isExpanded ? t('action:see-less') : t('action:see-n-more', { n: hiddenValuesCount }) }}
    </UiButton>
  </div>
</template>

<script lang="ts" setup>
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { useToggle } from '@vueuse/shared'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { values, maxVisibleValues } = defineProps<{
  values: string[]
  maxVisibleValues?: number
}>()

defineSlots<{
  'first-row-addons'?(): any
}>()

const { t } = useI18n()

const [isExpanded, toggleExpanded] = useToggle(false)

const hiddenValuesCount = computed(() =>
  maxVisibleValues === undefined ? 0 : Math.max(values.length - maxVisibleValues, 0)
)

const visibleValues = computed(() => (isExpanded.value ? values : values.slice(0, maxVisibleValues)))
</script>

<style lang="postcss" scoped>
.card-row-value-list {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 0.8rem;

  .value-row {
    display: flex;
    align-items: flex-start;
    gap: 1.6rem;
  }

  .value {
    flex: 1 1 auto;
    min-width: 0;
    overflow-wrap: anywhere;
    color: var(--color-neutral-txt-primary);

    &:empty::before {
      content: '-';
    }
  }

  .addons {
    display: flex;
    gap: 0.8rem;
    height: 1lh;
    align-items: center;
  }

  .see-more {
    align-self: flex-start;
  }
}
</style>
