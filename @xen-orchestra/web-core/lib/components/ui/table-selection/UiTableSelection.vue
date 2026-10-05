<!-- v2 -->
<template>
  <div class="ui-table-selection typo-body-regular-small" :class="className">
    <span v-if="areAllItemsSelected" class="warning">
      <VtsIcon name="status:warning-circle" size="medium" class="icon" />
      <I18nT :plural="selectedCount" keypath="table-selection:all-n-objects-selected!" scope="global" tag="span">
        <template #watchOut>
          <span class="typo-body-bold-small">{{ t('table-selection:watch-out!') }}</span>
        </template>
        <template #n>{{ selectedCount }}</template>
      </I18nT>
    </span>

    <I18nT
      v-else-if="areAllPageItemsSelected && hiddenSelectedCount === 0"
      :plural="selectedCount"
      keypath="table-selection:n-objects-on-page-selected."
      scope="global"
      tag="span"
    >
      <template #objects>
        <span class="typo-body-bold-small">{{ t('table-selection:n-objects', selectedCount) }}</span>
      </template>
    </I18nT>

    <I18nT
      v-else
      :keypath="
        hiddenSelectedCount > 0
          ? 'table-selection:n-objects-selected-including.'
          : 'table-selection:n-objects-selected.'
      "
      :plural="selectedCount"
      scope="global"
      tag="span"
    >
      <template #objects>
        <span class="typo-body-bold-small">{{ t('table-selection:n-objects', selectedCount) }}</span>
      </template>
      <template #hidden>
        <span class="typo-body-bold-small">
          {{ t('table-selection:n-not-visible-on-page', hiddenSelectedCount) }}
        </span>
      </template>
    </I18nT>

    <UiButton v-if="canSelectAll" accent="warning" size="small" variant="tertiary" @click="emit('selectAll')">
      {{ t('action:select-all-n-objects', filteredCount) }}
    </UiButton>

    <UiButton v-if="canClearSelection" accent="brand" size="small" variant="tertiary" @click="emit('clearSelection')">
      {{ t('action:clear-selection') }}
    </UiButton>
  </div>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { toVariants } from '@core/utils/to-variants.util.ts'
import { computed } from 'vue'
import { I18nT, useI18n } from 'vue-i18n'

export type TableSelectionSize = 'small' | 'large'

const { size, hiddenSelectedCount, areAllPageItemsSelected, areAllFilteredItemsSelected, areAllItemsSelected } =
  defineProps<{
    size: TableSelectionSize
    selectedCount: number
    hiddenSelectedCount: number
    filteredCount: number
    areAllPageItemsSelected: boolean
    areAllFilteredItemsSelected: boolean
    areAllItemsSelected: boolean
  }>()

const emit = defineEmits<{
  selectAll: []
  clearSelection: []
}>()

const { t } = useI18n()

const canSelectAll = computed(() => areAllPageItemsSelected && !areAllFilteredItemsSelected)

const canClearSelection = computed(() => areAllItemsSelected || hiddenSelectedCount > 0)

const className = computed(() => toVariants({ size }))
</script>

<style lang="postcss" scoped>
.ui-table-selection {
  display: flex;
  gap: 0.8rem;
  color: var(--color-neutral-txt-secondary);

  &.size--small {
    flex-direction: column;
    align-items: flex-start;
  }

  &.size--large {
    flex-direction: row;
    align-items: center;
  }

  .warning {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }

  .icon {
    flex-shrink: 0;
  }
}
</style>
