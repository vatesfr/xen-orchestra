<template>
  <div class="collection-filter-row">
    <span class="or">{{ t('or') }}</span>
    <UiInput v-if="newFilter.isAdvanced" v-model="newFilter.content" accent="brand" />
    <template v-else>
      <FormSelect v-model="newFilter.builder.property" :before="currentFilterIcon">
        <option v-if="!newFilter.builder.property" value="">{{ `- ${t('property')} -` }}</option>
        <option v-for="(filter, property) in availableFilters" :key="property" :value="property">
          {{ filter.label ?? property }}
        </option>
      </FormSelect>
      <FormSelect v-if="hasComparisonSelect" v-model="newFilter.builder.comparison">
        <option v-for="(label, type) in comparisons" :key="type" :value="type">
          {{ label }}
        </option>
      </FormSelect>
      <FormSelect v-if="currentFilter?.type === 'enum'" v-model="newFilter.builder.value">
        <option v-if="!newFilter.builder.value" value="" />
        <option v-for="choice in enumChoices" :key="choice" :value="choice">
          {{ choice }}
        </option>
      </FormSelect>
      <UiInput v-else-if="hasValueInput" v-model="newFilter.builder.value" accent="brand" />
    </template>
    <UiActionButton v-if="!newFilter.isAdvanced" :icon="faPencil" @click="enableAdvancedMode" />
    <UiActionButton :icon="faRemove" @click="emit('remove', newFilter.id)" />
  </div>
</template>

<script lang="ts" setup>
import FormSelect from '@/components/form/FormSelect.vue'
import UiActionButton from '@/components/ui/UiActionButton.vue'
import { buildComplexMatcherNode } from '@/libs/complex-matcher.utils'
import { getFilterIcon } from '@/libs/utils'
import type { Filter, FilterComparisons, FilterComparisonType, Filters, FilterType, NewFilter } from '@/types/filter'
import UiInput from '@core/components/ui/input/UiInput.vue'
import { faPencil, faRemove } from '@fortawesome/free-solid-svg-icons'
import { useVModel } from '@vueuse/core'
import { computed, type Ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  availableFilters: Filters
  modelValue: NewFilter
}>()

const emit = defineEmits<{
  'update:modelValue': [value: NewFilter]
  remove: [filterId: number]
}>()

const { t } = useI18n()

const newFilter: Ref<NewFilter> = useVModel(props, 'modelValue', emit)

const getDefaultComparisonType = () => {
  const defaultTypes: { [key in FilterType]: FilterComparisonType } = {
    string: 'stringContains',
    boolean: 'booleanTrue',
    number: 'numberEquals',
    enum: 'enumIs',
  }

  return defaultTypes[props.availableFilters[newFilter.value.builder.property].type]
}

watch(
  () => newFilter.value.builder.property,
  () => {
    newFilter.value.builder.comparison = getDefaultComparisonType()
    newFilter.value.builder.value = ''
  }
)

const currentFilter = computed<Filter>(() => props.availableFilters[newFilter.value.builder.property])

const currentFilterIcon = computed(() => getFilterIcon(currentFilter.value))

const hasValueInput = computed(() => ['string', 'number'].includes(currentFilter.value?.type))

const hasComparisonSelect = computed(() => newFilter.value.builder.property !== '')

const enumChoices = computed(() => {
  if (!newFilter.value.builder.property) {
    return []
  }

  const availableFilter = props.availableFilters[newFilter.value.builder.property]

  if (availableFilter.type !== 'enum') {
    return []
  }

  return availableFilter.choices
})

const generatedFilter = computed(() => {
  if (newFilter.value.isAdvanced) {
    return newFilter.value.content
  }

  if (!newFilter.value.builder.comparison) {
    return ''
  }

  try {
    const node = buildComplexMatcherNode(
      newFilter.value.builder.comparison,
      newFilter.value.builder.property,
      newFilter.value.builder.value
    )

    if (node) {
      return node.toString()
    }

    return ''
  } catch (e) {
    return ''
  }
})

const enableAdvancedMode = () => {
  newFilter.value.content = generatedFilter.value
  newFilter.value.isAdvanced = true
}

watch(generatedFilter, value => {
  newFilter.value.content = value
})

const comparisons = computed<FilterComparisons>(() => {
  const comparisonsByType = {
    string: {
      stringContains: t('filter.comparison.contains'),
      stringEquals: t('filter.comparison.equals'),
      stringStartsWith: t('filter.comparison.starts-with'),
      stringEndsWith: t('filter.comparison.ends-with'),
      stringMatchesRegex: t('filter.comparison.matches-regex'),
      stringDoesNotContain: t('filter.comparison.not-contain'),
      stringDoesNotEqual: t('filter.comparison.not-equal'),
      stringDoesNotStartWith: t('filter.comparison.not-start-with'),
      stringDoesNotEndWith: t('filter.comparison.not-end-with'),
      stringDoesNotMatchRegex: t('filter.comparison.not-match-regex'),
    },
    boolean: {
      booleanTrue: t('filter.comparison.is-true'),
      booleanFalse: t('filter.comparison.is-false'),
    },
    number: {
      numberLessThan: '<',
      numberLessThanOrEquals: '<=',
      numberEquals: '=',
      numberGreaterThanOrEquals: '>=',
      numberGreaterThan: '>',
    },
    enum: {
      enumIs: t('filter.comparison.is'),
      enumIsNot: t('filter.comparison.is-not'),
    },
  }

  return comparisonsByType[currentFilter.value.type]
})
</script>

<style lang="postcss" scoped>
.collection-filter-row {
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--color-neutral-background-secondary);
  gap: 1rem;

  .or {
    text-transform: uppercase;
  }

  &:only-child {
    .or,
    .remove {
      display: none;
    }
  }

  &:first-child .or {
    visibility: hidden;
  }
}

.ui-action-button:first-of-type {
  margin-left: auto;
}
</style>
