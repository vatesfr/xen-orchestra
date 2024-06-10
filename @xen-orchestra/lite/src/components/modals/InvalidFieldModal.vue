<template>
  <UiModal color="error" @submit="modal.approve()">
    <ConfirmModalLayout :icon="faExclamationCircle">
      <template #title>{{ $t('invalid-field') }}</template>

      <template #default>
        {{ message }}
      </template>

      <template #buttons>
        <ModalApproveButton>
          {{ $t('ok') }}
        </ModalApproveButton>
      </template>
    </ConfirmModalLayout>
  </UiModal>
</template>

<script lang="ts" setup>
import ConfirmModalLayout from '@/components/ui/modals/layouts/ConfirmModalLayout.vue'
import ModalApproveButton from '@/components/ui/modals/ModalApproveButton.vue'
import UiModal from '@/components/ui/modals/UiModal.vue'
import { IK_MODAL } from '@/types/injection-keys'
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons'
import { inject } from 'vue'

defineProps<{
  message: string
}>()

const modal = inject(IK_MODAL)!
</script>
