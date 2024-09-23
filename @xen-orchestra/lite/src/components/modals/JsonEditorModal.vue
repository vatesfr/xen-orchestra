<template>
  <UiModal :color="isJsonValid ? 'success' : 'error'" @submit.prevent="handleSubmit()">
    <FormModalLayout :icon="faCode" class="layout">
      <template #default>
        <FormTextarea v-model="editedJson" class="modal-textarea" />
      </template>

      <template #buttons>
        <UiButton size="medium" color="normal" level="tertiary" @click="formatJson()">
          {{ $t('reformat') }}
        </UiButton>
        <ModalDeclineButton />
        <ModalApproveButton :disabled="!isJsonValid">
          {{ $t('save') }}
        </ModalApproveButton>
      </template>
    </FormModalLayout>
  </UiModal>
</template>

<script lang="ts" setup>
import FormTextarea from '@/components/form/FormTextarea.vue'
import FormModalLayout from '@/components/ui/modals/layouts/FormModalLayout.vue'
import ModalApproveButton from '@/components/ui/modals/ModalApproveButton.vue'
import ModalDeclineButton from '@/components/ui/modals/ModalDeclineButton.vue'
import UiModal from '@/components/ui/modals/UiModal.vue'
import { IK_MODAL } from '@/types/injection-keys'
import UiButton from '@core/components/button/UiButton.vue'
import { faCode } from '@fortawesome/free-solid-svg-icons'
import { computed, inject, ref } from 'vue'

const props = defineProps<{
  initialValue?: string
}>()

const editedJson = ref<string>(props.initialValue ?? '')
const modal = inject(IK_MODAL)!

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

  modal.approve(editedJson.value)
}
</script>

<style lang="postcss" scoped>
.layout:deep(.modal-textarea) {
  min-width: 50rem;
  min-height: 20rem;
}
</style>
