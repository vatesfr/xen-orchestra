<template>
  <UiFilterGroup class="collection-sorter">
    <UiFilter
      v-for="[property, isAscending] in activeSorts"
      :key="property"
      @edit="emit('toggleSortDirection', property)"
      @remove="emit('removeSort', property)"
    >
      <span class="property">
        <UiIcon :icon="isAscending ? faCaretUp : faCaretDown" />
        {{ property }}
      </span>
    </UiFilter>

    <UiActionButton :icon="faPlus" class="add-sort" @click="open">
      {{ $t("add-sort") }}
    </UiActionButton>
  </UiFilterGroup>

  <UiModal v-if="isOpen" :icon="faSort" @submit.prevent="handleSubmit">
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
    <template #buttons>
      <UiButton type="submit">{{ $t("add") }}</UiButton>
      <UiButton outlined @click="handleCancel">
        {{ $t("cancel") }}
      </UiButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import FormWidget from "@/components/FormWidget.vue";
import UiActionButton from "@/components/ui/UiActionButton.vue";
import UiButton from "@/components/ui/UiButton.vue";
import UiFilter from "@/components/ui/UiFilter.vue";
import UiFilterGroup from "@/components/ui/UiFilterGroup.vue";
import UiIcon from "@/components/ui/icon/UiIcon.vue";
import UiModal from "@/components/ui/UiModal.vue";
import useModal from "@/composables/modal.composable";
import type { ActiveSorts, Sorts } from "@/types/sort";
import {
  faCaretDown,
  faCaretUp,
  faPlus,
  faSort,
} from "@fortawesome/free-solid-svg-icons";
import { ref } from "vue";

defineProps<{
  availableSorts: Sorts;
  activeSorts: ActiveSorts<Record<string, any>>;
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
