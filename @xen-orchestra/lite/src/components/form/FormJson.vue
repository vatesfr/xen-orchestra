<template>
  <UiModal
    v-model="isCodeModalOpen"
    :color="isJsonValid ? 'success' : 'error'"
    :icon="faCode"
    closable
  >
    <ModalContainer @submit.prevent="saveJson">
      <FormTextarea class="modal-textarea" v-model="editedJson" />
      <template #footer>
        <UiButtonGroup>
          <UiButton transparent @click="formatJson">
            {{ $t("reformat") }}
          </UiButton>
          <UiButton outlined @click="closeCodeModal">
            {{ $t("cancel") }}
          </UiButton>
          <UiButton :disabled="!isJsonValid" type="submit">
            {{ $t("save") }}
          </UiButton>
        </UiButtonGroup>
      </template>
    </ModalContainer>
  </UiModal>

  <FormInput
    @click="openCodeModal"
    :model-value="jsonValue"
    :before="faCode"
    readonly
  />
</template>

<script lang="ts" setup>
import FormInput from "@/components/form/FormInput.vue";
import FormTextarea from "@/components/form/FormTextarea.vue";
import ModalContainer from "@/components/ui/modals/ModalContainer.vue";
import UiModal from "@/components/ui/modals/UiModal.vue";
import UiButton from "@/components/ui/UiButton.vue";
import UiButtonGroup from "@/components/ui/UiButtonGroup.vue";
import useModal from "@/composables/modal.composable";
import { faCode } from "@fortawesome/free-solid-svg-icons";
import { useVModel, whenever } from "@vueuse/core";
import { computed, ref } from "vue";

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

whenever(isCodeModalOpen, () => (editedJson.value = jsonValue.value));

const editedJson = ref();
</script>

<style lang="postcss" scoped>
:deep(.modal-textarea) {
  min-width: 50rem;
  min-height: 20rem;
}
</style>
