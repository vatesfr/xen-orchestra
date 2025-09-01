<template>
  <VtsModal
    :accent="isJsonValid ? 'success' : 'danger'"
    class="json-editor-modal"
    icon="fa:code"
    @confirm="handleSubmit()"
  >
    <template #content>
      <UiTextarea v-model="editedJson" accent="brand" class="modal-textarea" />
      <VtsModalButton variant="tertiary" @click="formatJson()">
        {{ t('reformat') }}
      </VtsModalButton>
    </template>

    <template #buttons>
      <VtsModalCancelButton />
      <VtsModalConfirmButton :disabled="!isJsonValid">
        {{ t('save') }}
      </VtsModalConfirmButton>
    </template>
  </VtsModal>
</template>

<script lang="ts" setup>
import VtsModal from '@core/components/modal/VtsModal.vue'
import VtsModalButton from '@core/components/modal/VtsModalButton.vue'
import VtsModalCancelButton from '@core/components/modal/VtsModalCancelButton.vue'
import VtsModalConfirmButton from '@core/components/modal/VtsModalConfirmButton.vue'
import UiTextarea from '@core/components/ui/text-area/UiTextarea.vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { initialValue } = defineProps<{
  initialValue?: string
}>()

const emit = defineEmits<{
  confirm: [editedJson: string]
}>()

const { t } = useI18n()

const editedJson = ref<string>(initialValue ?? '')

const isJsonValid = computed(() => {
  try {
    JSON.parse(editedJson.value)
    return true
  } catch {
    return false
  }
})

const formatJson = () => {
  if (!isJsonValid.value) {
    return
  }

  editedJson.value = JSON.stringify(JSON.parse(editedJson.value), undefined, 2)
}

const handleSubmit = () => {
  if (!isJsonValid.value) {
    return
  }

  formatJson()

  emit('confirm', editedJson.value)
}
</script>

<style lang="postcss" scoped>
.json-editor-modal:deep(.modal-textarea) {
  min-height: 20rem;
  margin-bottom: 1rem;
}
</style>
