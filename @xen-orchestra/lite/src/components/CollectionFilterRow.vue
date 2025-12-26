<template>
  <div class="collection-filter-row">
    <span class="or">{{ t('or') }}</span>
    <div class="inputs">
      <UiInput v-if="newFilter.isAdvanced" v-model="filterContent" accent="brand" class="advanced-input" />
      <template v-else>
        <VtsSelect :id="builderPropertySelectId" accent="brand" :icon="currentFilterIcon" />
        <VtsSelect v-if="hasComparisonSelect" :id="builderComparisonSelectId" accent="brand" />
        <VtsSelect v-if="currentFilter?.type === 'enum'" :id="builderValueSelectId" accent="brand" />
        <UiInput v-else-if="hasValueInput" v-model="newFilter.builder.value" accent="brand" />
      </template>
    </div>
    <div class="buttons">
      <UiActionButton v-if="!newFilter.isAdvanced" icon="fa:pencil" @click="enableAdvancedMode" />
      <UiActionButton icon="fa:remove" @click="emit('remove', newFilter.id)" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import UiActionButton from '@/components/ui/UiActionButton.vue'
import { buildComplexMatcherNode } from '@/libs/complex-matcher.utils'
import { getFilterIcon } from '@/libs/utils'
import type { Filter, FilterComparisons, FilterComparisonType, Filters, FilterType, NewFilter } from '@/types/filter'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import { useFormSelect } from '@core/packages/form-select'
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { availableFilters } = defineProps<{
  availableFilters: Filters
}>()

const emit = defineEmits<{
  remove: [filterId: number]
}>()

const newFilter = defineModel<NewFilter>({ required: true })

const filterContent = computed({
  get: () => newFilter.value.content,
  set: (content: string) => {
    newFilter.value = {
      ...newFilter.value,
      content,
    }
  },
})

const builderProperty = computed({
  get: () => newFilter.value.builder.property,
  set: (property: string) => {
    newFilter.value = {
      ...newFilter.value,
      builder: {
        ...newFilter.value.builder,
        property,
        comparison: getDefaultComparisonType(property),
        value: '',
      },
    }
  },
})

const builderComparison = computed({
  get: () => newFilter.value.builder.comparison,
  set: (comparison: FilterComparisonType) => {
    newFilter.value = {
      ...newFilter.value,
      builder: {
        ...newFilter.value.builder,
        comparison,
      },
    }
  },
})

const builderValue = computed({
  get: () => newFilter.value.builder.value,
  set: (value: string) => {
    newFilter.value = {
      ...newFilter.value,
      builder: {
        ...newFilter.value.builder,
        value,
      },
    }
  },
})

const { t } = useI18n()

function getDefaultComparisonType(property: string) {
  const defaultTypes: { [key in FilterType]: FilterComparisonType } = {
    string: 'stringContains',
    boolean: 'booleanTrue',
    number: 'numberEquals',
    enum: 'enumIs',
  }

  return defaultTypes[availableFilters[property].type]
}

const currentFilter = computed<Filter | undefined>(() => availableFilters[builderProperty.value])

const currentFilterIcon = computed(() => getFilterIcon(currentFilter.value))

const hasValueInput = computed(() =>
  currentFilter.value ? ['string', 'number'].includes(currentFilter.value?.type) : false
)

const hasComparisonSelect = computed(() => builderProperty.value !== '')

const enumChoices = computed(() => {
  if (!builderProperty.value) {
    return []
  }

  const availableFilter = availableFilters[builderProperty.value]

  if (availableFilter.type !== 'enum') {
    return []
  }

  return availableFilter.choices
})

const generatedFilter = computed(() => {
  if (newFilter.value.isAdvanced) {
    return newFilter.value.content
  }

  if (!builderComparison.value) {
    return ''
  }

  try {
    const node = buildComplexMatcherNode(builderComparison.value, builderProperty.value, builderValue.value)

    if (node) {
      return node.toString()
    }

    return ''
  } catch (e) {
    return ''
  }
})

const enableAdvancedMode = () => {
  newFilter.value = {
    ...newFilter.value,
    isAdvanced: true,
    content: generatedFilter.value,
  }
}

watch(generatedFilter, value => {
  newFilter.value = {
    ...newFilter.value,
    content: value,
  }
})

const comparisons = computed<FilterComparisons>(() => {
  const comparisonsByType = {
    string: {
      stringContains: t('filter:comparison:contains'),
      stringEquals: t('filter:comparison:equals'),
      stringStartsWith: t('filter:comparison:starts-with'),
      stringEndsWith: t('filter:comparison:ends-with'),
      stringMatchesRegex: t('filter:comparison:matches-regex'),
      stringDoesNotContain: t('filter:comparison:not-contain'),
      stringDoesNotEqual: t('filter:comparison:not-equal'),
      stringDoesNotStartWith: t('filter:comparison:not-start-with'),
      stringDoesNotEndWith: t('filter:comparison:not-end-with'),
      stringDoesNotMatchRegex: t('filter:comparison:not-match-regex'),
    },
    boolean: {
      booleanTrue: t('filter:comparison:is-true'),
      booleanFalse: t('filter:comparison:is-false'),
    },
    number: {
      numberLessThan: '<',
      numberLessThanOrEquals: '<=',
      numberEquals: '=',
      numberGreaterThanOrEquals: '>=',
      numberGreaterThan: '>',
    },
    enum: {
      enumIs: t('filter:comparison:is'),
      enumIsNot: t('filter:comparison:is-not'),
    },
  }

  return currentFilter.value?.type ? comparisonsByType[currentFilter.value.type] : {}
})

// BUILDER PROPERTY SELECT

const { id: builderPropertySelectId } = useFormSelect(Object.entries(availableFilters), {
  model: builderProperty,
  placeholder: `- ${t('property')} -`,
  option: {
    id: ([property]) => property,
    label: ([property, filter]) => filter.label ?? property,
    value: ([property]) => property,
  },
})

// BUILDER COMPARISON SELECT

const { id: builderComparisonSelectId } = useFormSelect(
  () => (hasComparisonSelect.value ? Object.entries(comparisons.value) : []),
  {
    model: builderComparison,
    option: {
      id: ([type]) => type,
      label: ([, label]) => label,
      value: ([type]) => type,
    },
  }
)

// BUILDER VALUE SELECT

const { id: builderValueSelectId } = useFormSelect(
  () => (currentFilter.value?.type === 'enum' ? enumChoices.value : []),
  {
    model: builderValue,
  }
)
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

  .inputs,
  .buttons {
    display: flex;
    gap: 1rem;

    @media (--small) {
      flex-direction: column;
      gap: 0.5rem;
    }
  }

  .inputs {
    flex: 1;
  }

  .buttons {
    margin-left: auto;
  }
}
</style>
