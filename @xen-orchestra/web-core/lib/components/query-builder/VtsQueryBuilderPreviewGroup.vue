<template>
  <div class="vts-query-builder-preview-group">
    <template v-for="(child, index) of group.children" :key="child.id">
      <VtsQueryBuilderPreviewGroup
        v-if="child.isGroup"
        :group="child"
        :prefix="getChildPrefix(index, true)"
        :class="{ nested: index > 0 }"
      />
      <div v-else class="line typo-body-regular">
        <span class="prefix">{{ getChildPrefix(index, false) }}</span>
        <UiTag accent="neutral" variant="primary">{{ getPropertyLabel(child) }}</UiTag>
        <span>{{ getOperatorLabel(child) }}</span>
        <template v-if="getValue(child) !== undefined">
          <UiTag v-if="getValue(child)?.isEnum" accent="neutral" variant="primary">{{ getValue(child)?.label }}</UiTag>
          <span v-else>{{ getValue(child)?.label }}</span>
        </template>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import UiTag from '@core/components/ui/tag/UiTag.vue'
import type { QueryBuilderFilter, QueryBuilderGroup } from '@core/packages/query-builder/types.ts'
import { useI18n } from 'vue-i18n'

const { group, prefix } = defineProps<{
  group: QueryBuilderGroup
  prefix: string
}>()

const { t } = useI18n()

function getChildPrefix(index: number, isGroup: boolean): string {
  if (index === 0) {
    return prefix
  }

  if (group.operator === 'or') {
    return isGroup ? t('query-preview:or-where') : t('query-preview:or')
  }

  return t('query-preview:and')
}

function getPropertyLabel(filter: QueryBuilderFilter): string {
  return filter.property !== undefined ? (group.schema[filter.property]?.label ?? filter.property) : ''
}

function getOperatorLabel(filter: QueryBuilderFilter): string {
  if (filter.property === undefined || filter.operator === undefined) {
    return ''
  }

  const label = group.schema[filter.property]?.operators[filter.operator]?.label ?? filter.operator

  return label.toLowerCase()
}

function getValue(filter: QueryBuilderFilter): { label: string; isEnum: boolean } | undefined {
  if (filter.value === undefined || filter.value === '') {
    return undefined
  }

  const values =
    filter.property !== undefined && filter.operator !== undefined
      ? group.schema[filter.property]?.operators[filter.operator]?.values
      : undefined

  const enumValue = values?.[filter.value]

  if (enumValue !== undefined) {
    return { label: enumValue.label, isEnum: true }
  }

  const rawValue = String(filter.value)

  return { label: Number.isNaN(Number(rawValue)) ? `"${rawValue}"` : rawValue, isEnum: false }
}
</script>

<style lang="postcss" scoped>
.vts-query-builder-preview-group {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;

  &.nested {
    margin-block-start: 0.8rem;
  }

  .line {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.8rem;
  }

  .prefix {
    min-width: 4.8rem;
  }
}
</style>
