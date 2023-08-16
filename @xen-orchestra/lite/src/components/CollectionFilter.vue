<template>
  <UiFilterGroup>
    <UiFilter
      v-for="filter in activeFilters"
      :key="filter"
      @edit="editFilter(filter)"
      @remove="emit('removeFilter', filter)"
    >
      {{ filter }}
    </UiFilter>

    <UiActionButton :icon="faPlus" class="add-filter" @click="open">
      {{ $t("add-filter") }}
    </UiActionButton>
  </UiFilterGroup>

  <UiModal v-model="isOpen">
    <BasicModalLayout @submit.prevent="handleSubmit" :icon="faFilter">
      <div class="rows">
        <CollectionFilterRow
          v-for="(newFilter, index) in newFilters"
          :key="newFilter.id"
          v-model="newFilters[index]"
          :available-filters="availableFilters"
          @remove="removeNewFilter"
        />
      </div>

      <div
        v-if="newFilters.some((filter) => filter.isAdvanced)"
        class="available-properties"
      >
        {{ $t("available-properties-for-advanced-filter") }}
        <div class="properties">
          <UiBadge
            v-for="(filter, property) in availableFilters"
            :key="property"
            :icon="getFilterIcon(filter)"
          >
            {{ property }}
          </UiBadge>
        </div>
      </div>

      <template #buttons>
        <UiButton transparent @click="addNewFilter">
          {{ $t("add-or") }}
        </UiButton>
        <UiButton :disabled="!isFilterValid" type="submit">
          {{ $t(editedFilter ? "update" : "add") }}
        </UiButton>
        <UiButton outlined @click="close">
          {{ $t("cancel") }}
        </UiButton>
      </template>
    </BasicModalLayout>
  </UiModal>
</template>

<script lang="ts" setup>
import CollectionFilterRow from "@/components/CollectionFilterRow.vue";
import BasicModalLayout from "@/components/ui/modals/layouts/BasicModalLayout.vue";
import UiModal from "@/components/ui/modals/UiModal.vue";
import UiActionButton from "@/components/ui/UiActionButton.vue";
import UiBadge from "@/components/ui/UiBadge.vue";
import UiButton from "@/components/ui/UiButton.vue";
import UiFilter from "@/components/ui/UiFilter.vue";
import UiFilterGroup from "@/components/ui/UiFilterGroup.vue";
import useModal from "@/composables/modal.composable";
import { getFilterIcon } from "@/libs/utils";
import type { Filters, NewFilter } from "@/types/filter";
import { faFilter, faPlus } from "@fortawesome/free-solid-svg-icons";
import { Or, parse } from "complex-matcher";
import { computed, ref } from "vue";

defineProps<{
  activeFilters: string[];
  availableFilters: Filters;
}>();

const emit = defineEmits<{
  (event: "addFilter", filter: string): void;
  (event: "removeFilter", filter: string): void;
}>();

const { isOpen, open, close } = useModal({ onClose: () => reset() });
const newFilters = ref<NewFilter[]>([]);
let newFilterId = 0;

const addNewFilter = () =>
  newFilters.value.push({
    id: newFilterId++,
    content: "",
    isAdvanced: false,
    builder: { property: "", comparison: "", value: "", negate: false },
  });

const removeNewFilter = (id: number) => {
  const index = newFilters.value.findIndex((newFilter) => newFilter.id === id);
  if (index >= 0) {
    newFilters.value.splice(index, 1);
  }
};

addNewFilter();

const generatedFilter = computed(() => {
  const filters = newFilters.value.filter(
    (newFilter) => newFilter.content !== ""
  );

  if (filters.length === 0) {
    return "";
  }

  if (filters.length === 1) {
    return filters[0].content;
  }

  return `|(${filters.map((filter) => filter.content).join(" ")})`;
});

const isFilterValid = computed(() => generatedFilter.value !== "");

const editedFilter = ref();

const editFilter = (filter: string) => {
  const parsedFilter = parse(filter);

  const nodes =
    parsedFilter instanceof Or ? parsedFilter.children : [parsedFilter];

  newFilters.value = nodes.map((node) => ({
    id: newFilterId++,
    content: node.toString(),
    isAdvanced: true,
    builder: { property: "", comparison: "", value: "", negate: false },
  }));
  editedFilter.value = filter;
  open();
};

const reset = () => {
  editedFilter.value = "";
  newFilters.value = [];
  addNewFilter();
};

const handleSubmit = () => {
  if (editedFilter.value) {
    emit("removeFilter", editedFilter.value);
  }
  emit("addFilter", generatedFilter.value);
  reset();
  close();
};
</script>

<style lang="postcss" scoped>
.properties {
  font-size: 1.6rem;
  margin-top: 1rem;

  ul {
    margin-left: 1rem;
  }

  li {
    cursor: pointer;

    &:hover {
      opacity: 0.7;
    }
  }
}

.available-properties {
  margin-top: 1rem;
}

.properties {
  display: flex;
  margin-top: 0.6rem;
  gap: 0.5rem;
}

.rows {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
