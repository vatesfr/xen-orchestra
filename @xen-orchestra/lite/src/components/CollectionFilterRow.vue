<template>
  <div class="collection-filter-row">
    <span class="or">OR</span>
    <FormWidget v-if="newFilter.isAdvanced" style="flex: 1">
      <input v-model="newFilter.content" />
    </FormWidget>
    <template v-else>
      <FormWidget :before="currentFilterIcon">
        <select v-model="newFilter.builder.property">
          <option v-if="!newFilter.builder.property" value="">
            - Property -
          </option>
          <option
            v-for="(filter, property) in availableFilters"
            :key="property"
            :value="property"
          >
            {{ filter.label ?? property }}
          </option>
        </select>
      </FormWidget>
      <template v-if="hasComparisonSelect">
        <FormWidget v-if="currentFilter?.type === 'string'">
          <select v-model="newFilter.builder.negate">
            <option :value="false">does</option>
            <option :value="true">does not</option>
          </select>
        </FormWidget>
        <FormWidget v-if="hasComparisonSelect">
          <select v-model="newFilter.builder.comparison">
            <option
              v-for="(label, type) in comparisons"
              :key="type"
              :value="type"
            >
              {{ label }}
            </option>
          </select>
        </FormWidget>
      </template>
      <FormWidget
        v-if="hasValueInput"
        :after="valueInputAfter"
        :before="valueInputBefore"
      >
        <input v-model="newFilter.builder.value" />
      </FormWidget>
      <template v-else-if="currentFilter?.type === 'enum'">
        <FormWidget>
          <select v-model="newFilter.builder.negate">
            <option :value="false">is</option>
            <option :value="true">is not</option>
          </select>
        </FormWidget>
        <FormWidget>
          <select v-model="newFilter.builder.value">
            <option v-if="!newFilter.builder.value" value="" />
            <option v-for="choice in enumChoices" :key="choice" :value="choice">
              {{ choice }}
            </option>
          </select>
        </FormWidget>
      </template>
    </template>
    <UiButton
      v-if="!newFilter.isAdvanced"
      color="secondary"
      @click="enableAdvancedMode"
    >
      <FontAwesomeIcon :icon="faPencil" />
    </UiButton>
    <UiButton
      class="remove"
      color="secondary"
      @click="emit('remove', newFilter.id)"
    >
      <FontAwesomeIcon :icon="faRemove" class="remove-icon" />
    </UiButton>
  </div>
</template>

<script lang="ts" setup>
import { computed, watch } from "vue";
import type {
  Filter,
  FilterComparisonType,
  FilterComparisons,
  FilterType,
  Filters,
  NewFilter,
} from "@/types/filter";
import { faPencil, faRemove } from "@fortawesome/pro-solid-svg-icons";
import { useVModel } from "@vueuse/core";
import FormWidget from "@/components/FormWidget.vue";
import UiButton from "@/components/ui/UiButton.vue";
import { buildComplexMatcherNode } from "@/libs/complex-matcher.utils";
import { getFilterIcon } from "@/libs/utils";

const props = defineProps<{
  availableFilters: Filters;
  modelValue: NewFilter;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: NewFilter): void;
  (event: "remove", filterId: number): void;
}>();

const newFilter = useVModel(props, "modelValue", emit);

const getDefaultComparisonType = () => {
  const defaultTypes: { [key in FilterType]: FilterComparisonType } = {
    string: "stringContains",
    boolean: "booleanTrue",
    number: "numberEquals",
    enum: "stringEquals",
  };

  return defaultTypes[
    props.availableFilters[newFilter.value.builder.property].type
  ];
};

watch(
  () => newFilter.value.builder.property,
  () => {
    newFilter.value.builder.comparison = getDefaultComparisonType();
    newFilter.value.builder.value = "";
    newFilter.value.builder.negate = false;
  }
);

const currentFilter = computed<Filter>(
  () => props.availableFilters[newFilter.value.builder.property]
);

const currentFilterIcon = computed(() => getFilterIcon(currentFilter.value));

const hasValueInput = computed(() =>
  ["string", "number"].includes(currentFilter.value?.type)
);

const hasComparisonSelect = computed(
  () => newFilter.value.builder.property && currentFilter.value?.type !== "enum"
);

const enumChoices = computed(() => {
  if (!newFilter.value.builder.property) {
    return [];
  }

  const availableFilter =
    props.availableFilters[newFilter.value.builder.property];

  if (availableFilter.type !== "enum") {
    return [];
  }

  return availableFilter.choices;
});

const generatedFilter = computed(() => {
  if (newFilter.value.isAdvanced) {
    return newFilter.value.content;
  }

  if (!newFilter.value.builder.comparison) {
    return "";
  }

  try {
    const node = buildComplexMatcherNode(
      newFilter.value.builder.comparison,
      newFilter.value.builder.property,
      newFilter.value.builder.value,
      newFilter.value.builder.negate
    );

    if (node) {
      return node.toString();
    }

    return "";
  } catch (e) {
    return "";
  }
});

const enableAdvancedMode = () => {
  newFilter.value.content = generatedFilter.value;
  newFilter.value.isAdvanced = true;
};

watch(generatedFilter, (value) => {
  newFilter.value.content = value;
});

const comparisons = computed<FilterComparisons>(() => {
  const comparisonsByType = {
    string: {
      stringContains: "contain",
      stringEquals: "equal",
      stringStartsWith: "start with",
      stringEndsWith: "end with",
      stringMatchesRegex: "match regex",
    },
    boolean: {
      booleanTrue: "is true",
      booleanFalse: "is false",
    },
    number: {
      numberLessThan: "<",
      numberLessThanOrEquals: "<=",
      numberEquals: "=",
      numberGreaterThanOrEquals: ">=",
      numberGreaterThan: ">",
    },
    enum: {},
  };

  return comparisonsByType[currentFilter.value.type];
});

const valueInputBefore = computed(() => {
  return newFilter.value.builder.comparison === "stringMatchesRegex"
    ? "/"
    : undefined;
});

const valueInputAfter = computed(() => {
  return newFilter.value.builder.comparison === "stringMatchesRegex"
    ? "/i"
    : undefined;
});
</script>

<style lang="postcss" scoped>
.collection-filter-row {
  display: flex;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid var(--background-color-secondary);
  gap: 1rem;

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

.remove-icon {
  color: var(--color-red-vates-base);
}
</style>
