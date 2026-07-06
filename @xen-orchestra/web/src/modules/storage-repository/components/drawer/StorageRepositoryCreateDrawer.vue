<template>
  <VtsDrawer dismissible :is-open="undefined">
    <template #title>{{ t('action:create-sr') }}</template>
    <template #content>
      <NewStorageRepositoryForm ref="formRef" :pool-id="poolId" :host-id="hostId" />
    </template>
    <template #buttons>
      <VtsDrawerCancelButton />
      <VtsDrawerConfirmButton :on-click="handleConfirm">{{ t('action:create') }}</VtsDrawerConfirmButton>
    </template>
  </VtsDrawer>
</template>

<script setup lang="ts">
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import NewStorageRepositoryForm from '@/modules/storage-repository/components/form/new/NewStorageRepositoryForm.vue'
import VtsDrawer from '@core/components/drawer/VtsDrawer.vue'
import VtsDrawerCancelButton from '@core/components/drawer/VtsDrawerCancelButton.vue'
import VtsDrawerConfirmButton from '@core/components/drawer/VtsDrawerConfirmButton.vue'
import { IK_DRAWER } from '@core/packages/drawer/types.ts'
import { useModal } from '@core/packages/modal/use-modal.ts'
import { inject, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  poolId: FrontXoPool['id']
  hostId?: FrontXoHost['id']
}>()

const { t } = useI18n()

const drawer = inject(IK_DRAWER)
const formRef = useTemplateRef('formRef')

const openEraseConfirmModal = useModal((device: string) => ({
  component: import('@/modules/storage-repository/components/modal/SrCreateEraseConfirmModal.vue'),
  props: { device },
}))

async function handleConfirm() {
  const restPayload = await formRef.value?.validateAndBuildPayload()

  if (!restPayload) {
    return
  }

  if (formRef.value?.requiresEraseConfirm) {
    const response = await openEraseConfirmModal(restPayload.device_config.device ?? '')

    if (!response.confirmed) {
      return
    }
  }

  await drawer?.value.onConfirm(restPayload)
}
</script>
