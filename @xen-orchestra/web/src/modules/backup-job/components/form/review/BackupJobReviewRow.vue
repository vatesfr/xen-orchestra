<template>
  <VtsTabularKeyValueRow :label>
    <template v-if="slots.default || overridden || hasValue" #value>
      <span class="backup-job-review-row-value">
        <slot>{{ value }}</slot>
        <UiOverridden v-if="overridden">{{ t('overridden') }}</UiOverridden>
      </span>
    </template>
  </VtsTabularKeyValueRow>
</template>

<script lang="ts" setup>
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiOverridden from '@core/components/ui/overridden/UiOverridden.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { value } = defineProps<{
  label: string
  value?: string | number
  overridden?: boolean
}>()

const slots = defineSlots<{
  default?(): any
}>()

const { t } = useI18n()

const hasValue = computed(() => value !== undefined && value !== '')
</script>

<style lang="postcss" scoped>
.backup-job-review-row-value {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.8rem 1.6rem;
  max-width: 100%;
  white-space: normal;
  overflow-wrap: anywhere;
}
</style>
