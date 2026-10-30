<template>
  <div class="vts-query-builder-preview-group">
    <template v-for="(child, index) of children" :key="child.id">
      <VtsQueryBuilderPreviewGroup
        v-if="child.isGroup"
        :group="child.group"
        :prefix="child.prefix"
        :class="{ nested: index > 0 }"
      />
      <div v-else class="line typo-body-regular">
        <span class="prefix">{{ child.prefix }}</span>
        <UiTag accent="neutral" variant="primary">{{ child.propertyLabel }}</UiTag>
        <span>{{ child.operatorLabel }}</span>
        <template v-if="child.value !== undefined">
          <UiTag v-if="child.value.isEnum" accent="neutral" variant="primary">{{ child.value.label }}</UiTag>
          <span v-else>{{ child.value.label }}</span>
        </template>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import UiTag from '@core/components/ui/tag/UiTag.vue'
import type { QueryBuilderFilter, QueryBuilderGroup } from '@core/packages/query-builder/types.ts'
import { computed } from 'vue'
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

const children = computed(() =>
  group.children.map((child, index) =>
    child.isGroup
      ? { id: child.id, isGroup: true as const, group: child, prefix: getChildPrefix(index, true) }
      : {
          id: child.id,
          isGroup: false as const,
          prefix: getChildPrefix(index, false),
          propertyLabel: getPropertyLabel(child),
          operatorLabel: getOperatorLabel(child),
          value: getValue(child),
        }
  )
)
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
