<template>
  <UiModal
    @submit.prevent="saveJson"
    :color="isJsonValid ? 'success' : 'error'"
    v-if="isCodeModalOpen"
    :icon="faCode"
    @close="closeCodeModal"
  >
    <FormTextarea class="modal-textarea" v-model="editedJson" />
    <template #buttons>
      <UiButton transparent @click="formatJson">Reformat</UiButton>
      <UiButton outlined @click="closeCodeModal">Cancel</UiButton>
      <UiButton :disabled="!isJsonValid" type="submit">Save</UiButton>
    </template>
  </UiModal>
  <FormInput
    @click="openCodeModal"
    :model-value="jsonValue"
    :before="faCode"
    readonly
  />
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { faCode } from "@fortawesome/free-solid-svg-icons";
import { useVModel } from "@vueuse/core";
import FormInput from "@/components/form/FormInput.vue";
import FormTextarea from "@/components/form/FormTextarea.vue";
import UiButton from "@/components/ui/UiButton.vue";
import UiModal from "@/components/ui/UiModal.vue";
import useModal from "@/composables/modal.composable";

const props = defineProps<{
  modelValue: any;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: any): void;
}>();

const model = useVModel(props, "modelValue", emit);

const {
  open: openCodeModal,
  close: closeCodeModal,
  isOpen: isCodeModalOpen,
} = useModal();

const jsonValue = computed(() => JSON.stringify(model.value, undefined, 2));

const isJsonValid = computed(() => {
  try {
    JSON.parse(editedJson.value);
    return true;
  } catch {
    return false;
  }
});

const formatJson = () => {
  if (!isJsonValid.value) {
    return;
  }

  editedJson.value = JSON.stringify(JSON.parse(editedJson.value), undefined, 2);
};

const saveJson = () => {
  if (!isJsonValid.value) {
    return;
  }

  formatJson();

  model.value = JSON.parse(editedJson.value);

  closeCodeModal();
};

watch(isCodeModalOpen, (isOpen) => {
  if (isOpen) {
    editedJson.value = jsonValue.value;
  }
});

const editedJson = ref();
</script>

<style lang="postcss" scoped>
:deep(.modal-textarea) {
  min-width: 50rem;
  min-height: 20rem;
}
</style>
