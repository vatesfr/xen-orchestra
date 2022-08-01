<template>
  <UiFilterGroup class="collection-sorter">
    <UiFilter
      v-for="[property, isAscending] in activeSorts"
      :key="property"
      @edit="emit('toggleSortDirection', property)"
      @remove="emit('removeSort', property)"
    >
      <span style="display: inline-flex; align-items: center; gap: 0.7rem">
        <FontAwesomeIcon :icon="isAscending ? faCaretUp : faCaretDown" />
        {{ property }}
      </span>
    </UiFilter>

    <UiButton :icon="faPlus" class="add-sort" color="secondary" @click="open">
      Add sort
    </UiButton>
  </UiFilterGroup>

  <UiModal v-if="isOpen">
    <form @submit.prevent="handleSubmit">
      <div style="display: flex; gap: 1rem">
        <FormWidget label="Sort by">
          <select v-model="newSortProperty">
            <option v-if="!newSortProperty"></option>
            <option
              v-for="(sort, property) in availableSorts"
              :key="property"
              :value="property"
            >
              {{ sort.label ?? property }}
            </option>
          </select>
        </FormWidget>
        <FormWidget>
          <select v-model="newSortIsAscending">
            <option :value="true">ascending</option>
            <option :value="false">descending</option>
          </select>
        </FormWidget>
      </div>
      <UiButtonGroup>
        <UiButton type="submit"> Add</UiButton>
        <UiButton color="secondary" @click="handleCancel">Cancel</UiButton>
      </UiButtonGroup>
    </form>
  </UiModal>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import type { ActiveSorts, Sorts } from "@/types/sort";
import {
  faCaretDown,
  faCaretUp,
  faPlus,
} from "@fortawesome/pro-solid-svg-icons";
import FormWidget from "@/components/FormWidget.vue";
import UiButton from "@/components/ui/UiButton.vue";
import UiButtonGroup from "@/components/ui/UiButtonGroup.vue";
import UiFilter from "@/components/ui/UiFilter.vue";
import UiFilterGroup from "@/components/ui/UiFilterGroup.vue";
import UiModal from "@/components/ui/UiModal.vue";
import useModal from "@/composables/modal.composable";

defineProps<{
  availableSorts: Sorts;
  activeSorts: ActiveSorts;
}>();

const emit = defineEmits<{
  (event: "toggleSortDirection", property: string): void;
  (event: "addSort", property: string, isAscending: boolean): void;
  (event: "removeSort", property: string): void;
}>();

const { isOpen, open, close } = useModal();

const newSortProperty = ref();
const newSortIsAscending = ref<boolean>(true);

const reset = () => {
  // editedFilter.value = "";
  // newFilters.value = [];
  // addNewFilter();
};

const handleSubmit = () => {
  emit("addSort", newSortProperty.value, newSortIsAscending.value);
  reset();
  close();
};

const handleCancel = () => {
  reset();
  close();
};
</script>

<style lang="postcss" scoped>
.add-sort {
  height: 3.4rem;
}
</style>
