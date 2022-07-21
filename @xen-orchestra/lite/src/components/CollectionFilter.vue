<template>
  <UiFilterGroup>
    <UiFilter
      v-for="filter in activeFilters"
      :key="filter"
      @remove="emit('removeFilter', filter)"
    >
      {{ filter }}
    </UiFilter>

    <UiButton
      :icon-left="faPlus"
      class="add-filter"
      color="action"
      @click="open"
    >
      Add filter
    </UiButton>
  </UiFilterGroup>

  <UiModal v-if="isOpen">
    Add a filter
    <form @submit.prevent="handleSubmit">
      <div class="form-row" v-for="(item, index) in items" :key="index">
        <span v-if="items.length > 1" style="width: 2rem">{{
          index > 0 ? "OR" : ""
        }}</span>
        <FormWidget
          v-if="!isAdvancedModeEnabled"
          :before="filterIconForIndex(index)"
        >
          <select v-model="items[index].selectedFilter">
            <option v-if="!selectedFilter"></option>
            <option
              v-for="availableFilter in availableFilters"
              :key="availableFilter.property"
              :value="availableFilter"
            >
              {{ availableFilter.label ?? availableFilter.property }}
            </option>
          </select>
        </FormWidget>

        <FormWidget
          v-if="!isAdvancedModeEnabled && items[index].selectedFilter"
        >
          <select v-model="items[index].filterPattern">
            <option
              v-for="comparison in getComparisonsForIndex(index)"
              :key="comparison.pattern"
              :value="comparison.pattern"
            >
              {{ comparison.label }}
            </option>
          </select>
        </FormWidget>

        <FormWidget
          v-if="isFilterTakingValue(index)"
          :after="getComparisonForIndex(index)?.after"
          :before="getComparisonForIndex(index)?.before"
        >
          <input v-model="items[index].filterValue" />
        </FormWidget>
        <br />
      </div>

      <UiButtonGroup>
        <UiButton color="action" @click="addItem">+OR</UiButton>

        <UiButton
          type="submit"
          :disabled="!generatedFilter || !isGeneratedFilterValid"
        >
          Add
        </UiButton>

        <UiButton color="action" type="button" @click="handleCancel">
          Cancel
        </UiButton>
      </UiButtonGroup>
    </form>

    <div style="margin-top: 1rem">
      <UiButton
        v-if="!isAdvancedModeEnabled"
        @click="activateAdvancedMode"
        color="action"
      >
        Switch to advanced mode...
      </UiButton>
    </div>
  </UiModal>
</template>

<script lang="ts" setup>
import * as CM from "complex-matcher";
import { computed, ref } from "vue";
import type {
  AvailableFilter,
  FilterComparisons,
  FilterType,
} from "@/types/filter";
import { faSquareCheck } from "@fortawesome/free-regular-svg-icons";
import { faFont, faHashtag, faPlus } from "@fortawesome/free-solid-svg-icons";
import FormWidget from "@/components/FormWidget.vue";
import UiButton from "@/components/ui/UiButton.vue";
import UiButtonGroup from "@/components/ui/UiButtonGroup.vue";
import UiFilter from "@/components/ui/UiFilter.vue";
import UiFilterGroup from "@/components/ui/UiFilterGroup.vue";
import UiModal from "@/components/ui/UiModal.vue";
import useModal from "@/composables/modal.composable";
import { escapeRegExp } from "@/libs/utils";

defineProps<{
  availableFilters: AvailableFilter[];
  activeFilters: string[];
}>();

const emit = defineEmits<{
  (event: "addFilter", filter: string): void;
  (event: "removeFilter", filter: string): void;
}>();

const { open, close, isOpen } = useModal();

const getComparisonsForIndex = (index: number) => {
  const selectedFilter = items.value[index]?.selectedFilter;

  if (!selectedFilter) {
    return [];
  }

  switch (selectedFilter.type) {
    case "string":
      return [
        { label: "contains", pattern: "%p:%v", default: true },
        { label: "equals", pattern: "%p:/^%v$/i", escape: true },
        { label: "starts with", pattern: "%p:/^%v/i", escape: true },
        { label: "ends with", pattern: "%p:/%v$/i", escape: true },
        {
          label: "matches regex",
          pattern: "%p:/%v/i",
          before: "/",
          after: "/i",
        },
      ];
    case "number":
      return [
        { label: "<", pattern: "%p:<%v" },
        { label: "<=", pattern: "%p:<=%v" },
        { label: "=", pattern: "%p:%v", default: true },
        { label: ">=", pattern: "%p:>=%v" },
        { label: ">", pattern: "%p:>%v" },
      ];
    case "boolean":
      return [
        { label: "is true", pattern: "%p?", default: true },
        { label: "is false", pattern: "!%p?" },
      ];
    case "enum":
      return selectedFilter.choices.map((choice, index) => ({
        label: choice,
        pattern: `%p:/^${escapeRegExp(choice)}$/`,
        default: index === 0,
      }));
  }
};

const comparisons = computed<FilterComparisons>(() => ({
  string: [
    { label: "contains", pattern: "%p:%v", default: true },
    { label: "equals", pattern: "%p:/^%v$/i", escape: true },
    { label: "starts with", pattern: "%p:/^%v/i", escape: true },
    { label: "ends with", pattern: "%p:/%v$/i", escape: true },
    {
      label: "matches regex",
      pattern: "%p:/%v/i",
      before: "/",
      after: "/i",
    },
  ],
  number: [
    { label: "<", pattern: "%p:<%v" },
    { label: "<=", pattern: "%p:<=%v" },
    { label: "=", pattern: "%p:%v", default: true },
    { label: ">=", pattern: "%p:>=%v" },
    { label: ">", pattern: "%p:>%v" },
  ],
  boolean: [
    { label: "is true", pattern: "%p?", default: true },
    { label: "is false", pattern: "!%p?" },
  ],
  enum:
    selectedFilter.value?.type !== "enum"
      ? []
      : selectedFilter.value.choices.map((choice, index) => ({
          label: choice,
          pattern: `%p:/^${escapeRegExp(choice)}$/`,
          default: index === 0,
        })),
}));

const isAdvancedModeEnabled = ref(false);

const selectedFilter = ref<AvailableFilter>();

const filterPattern = ref<string>();

const currentComparison = computed(() => {
  if (!selectedFilter.value) {
    return;
  }
  return comparisons.value[selectedFilter.value.type].find(
    (comparison) => comparison.pattern === filterPattern.value
  );
});

const getComparisonForIndex = (index: number) => {
  const type = items.value[index]?.selectedFilter?.type;
  const pattern = items.value[index]?.filterPattern;

  if (!type || !pattern) {
    return;
  }

  return comparisons.value[type].find(
    (comparison) => comparison.pattern === pattern
  );
};

const getDefaultPatternForFilterType = (filterType?: FilterType) => {
  if (!filterType) {
    return;
  }

  return comparisons.value[filterType].find(({ default: def }) => def)?.pattern;
};

const items = ref<
  {
    selectedFilter: AvailableFilter | undefined;
    filterPattern: string;
    filterValue: string;
  }[]
>([]);

const filterIconForIndex = (index: number) => {
  const selectedFilter = items.value[index]?.selectedFilter;

  if (!selectedFilter) {
    return;
  }

  if (selectedFilter.icon) {
    return selectedFilter.icon;
  }

  switch (selectedFilter.type) {
    case "string":
      return faFont;
    case "number":
      return faHashtag;
    case "boolean":
      return faSquareCheck;
  }

  return undefined;
};

// watch(selectedFilter, (newSelectedFilter) => {
//   if (newSelectedFilter && !items.value.length) {
//     items.value.push({
//       filterPattern:
//         getDefaultPatternForFilterType(newSelectedFilter.type) || "",
//       filterValue: "",
//     });
//   }
//   filterPattern.value = getDefaultPatternForFilterType(newSelectedFilter?.type);
// });

const addItem = () => {
  items.value.push({
    selectedFilter: undefined,
    filterPattern: "",
    filterValue: "",
  });
};

addItem();

const isFilterTakingValue = (index: number) => {
  const comparison = getComparisonForIndex(index);

  return comparison?.pattern.includes("%v") || isAdvancedModeEnabled.value;
};

// const isFilterTakingValue = computed(() => {
//   return (
//     currentComparison.value?.pattern.includes("%v") ||
//     isAdvancedModeEnabled.value
//   );
// });

const filterValue = ref<string>();

const generatedFilter = computed(() => {
  if (items.value.length === 0) {
    return;
  }

  const result = items.value
    .map((item) => {
      return item.filterPattern
        .replace("%p", item.selectedFilter?.property)
        .replace(
          "%v",
          currentComparison.value?.escape
            ? escapeRegExp(item.filterValue)
            : item.filterValue
        );
    })
    .join(" ");

  if (items.value.length === 1) {
    return result;
  }

  return `|(${result})`;
});

// const generatedFilter2 = computed(() => {
//   if (isAdvancedModeEnabled.value) {
//     return filterValue.value;
//   }
//
//   if (!selectedFilter.value || !filterPattern.value) {
//     return;
//   }
//
//   if (isFilterTakingValue.value) {
//     if (!filterValue.value) {
//       return;
//     }
//
//     return filterPattern.value
//       .replace("%p", selectedFilter.value.property)
//       .replace(
//         "%v",
//         currentComparison.value?.escape
//           ? escapeRegExp(filterValue.value)
//           : filterValue.value
//       );
//   }
//
//   return filterPattern.value.replace("%p", selectedFilter.value.property);
// });

const isGeneratedFilterValid = computed(() => {
  if (!generatedFilter.value) {
    return true;
  }

  try {
    if (generatedFilter.value) {
      CM.parse(generatedFilter.value);
    }

    return true;
  } catch (e) {
    return false;
  }
});

const activateAdvancedMode = () => {
  filterValue.value = generatedFilter.value;
  isAdvancedModeEnabled.value = true;
};

const resetAndClose = () => {
  items.value = [];
  addItem();
  selectedFilter.value = undefined;
  filterValue.value = undefined;
  isAdvancedModeEnabled.value = false;
  close();
};

const handleSubmit = () => {
  if (generatedFilter.value) {
    emit("addFilter", generatedFilter.value);
    resetAndClose();
  }
};

const handleCancel = () => {
  resetAndClose();
};
</script>

<style scoped>
.add-filter {
  height: 3.4rem;
}

.form-row {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1rem;
}
</style>
