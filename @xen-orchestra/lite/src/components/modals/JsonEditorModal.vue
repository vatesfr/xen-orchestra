<template>
  <UiModal
    :accent="isJsonValid ? 'info' : 'danger'"
    class="json-editor-modal"
    icon="fa:code"
    @confirm="handleSubmit()"
    @dismiss="emit('cancel')"
  >
    <template #content>
      <UiTextarea v-model="editedJson" accent="brand" class="modal-textarea" />
      <VtsOverlayButton variant="tertiary" @click="formatJson()">
        {{ t('action:reformat') }}
      </VtsOverlayButton>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton :disabled="!isJsonValid">
        {{ t('action:save') }}
      </VtsOverlayConfirmButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import VtsOverlayButton from '@core/components/overlay/VtsOverlayButton.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiModal from '@core/components/ui/modal/UiModal.vue'
import UiTextarea from '@core/components/ui/text-area/UiTextarea.vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { initialValue } = defineProps<{
  initialValue?: string
}>()

const emit = defineEmits<{
  confirm: [editedJson: string]
  cancel: []
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
