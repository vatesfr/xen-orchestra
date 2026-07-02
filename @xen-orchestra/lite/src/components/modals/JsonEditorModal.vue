<template>
  <VtsOverlay
    type="modal"
    :accent="isJsonValid ? 'info' : 'danger'"
    class="json-editor-modal"
    icon="fa:code"
    @confirm="handleSubmit()"
  >
    <template #content>
      <UiTextarea v-model="editedJson" accent="brand" class="modal-textarea" />
      <VtsOverlayButton variant="tertiary" @click="formatJson()">
        {{ t('action:reformat') }}
      </VtsOverlayButton>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton />
      <VtsOverlayConfirmButton :disabled="!isJsonValid">
        {{ t('action:save') }}
      </VtsOverlayConfirmButton>
    </template>
  </VtsOverlay>
</template>

<script lang="ts" setup>
import VtsOverlay from '@core/components/overlay/VtsOverlay.vue'
import VtsOverlayButton from '@core/components/overlay/VtsOverlayButton.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
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
