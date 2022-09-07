<template>
  <UiFilterGroup class="collection-sorter">
    <UiFilter
      v-for="[property, isAscending] in activeSorts"
      :key="property"
      @edit="emit('toggleSortDirection', property)"
      @remove="emit('removeSort', property)"
    >
      <span class="property">
        <FontAwesomeIcon :icon="isAscending ? faCaretUp : faCaretDown" />
        {{ property }}
      </span>
    </UiFilter>

    <UiButton :icon="faPlus" class="add-sort" color="secondary" @click="open">
      {{ $t("add-sort") }}
    </UiButton>
  </UiFilterGroup>

  <UiModal v-if="isOpen">
    <form @submit.prevent="handleSubmit">
      <div class="form-widgets">
        <FormWidget :label="$t('sort-by')">
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
            <option :value="true">{{ $t("ascending") }}</option>
            <option :value="false">{{ $t("descending") }}</option>
          </select>
        </FormWidget>
      </div>
      <UiButtonGroup>
        <UiButton type="submit">{{ $t("add") }}</UiButton>
        <UiButton color="secondary" @click="handleCancel">
          {{ $t("cancel") }}
        </UiButton>
      </UiButtonGroup>
    </form>
>>>>>>> Merge old repo to XO
  </UiModal>
</template>

import { ref } from "vue";
import type { ActiveSorts, Sorts } from "@/types/sort";
import {
  faCaretDown,
  faCaretUp,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
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
  newSortProperty.value = undefined;
  newSortIsAscending.value = true;
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

.form-widgets {
  display: flex;
  gap: 1rem;
}

.property {
  display: inline-flex;
  align-items: center;
  gap: 0.7rem;
}
</style>
