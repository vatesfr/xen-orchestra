<template>
  <UiDrawer @dismiss="emit('cancel')" @confirm="handleConfirm()">
    <template #title>{{ t('action:create-sr') }}</template>

    <template #content>
      <NewStorageRepositoryForm ref="formRef" :pool-id :host-id />
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>{{ t('action:create') }}</VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script setup lang="ts">
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import NewStorageRepositoryForm from '@/modules/storage-repository/components/form/new/NewStorageRepositoryForm.vue'
import type { NewSrRestPayload } from '@/modules/storage-repository/jobs/xo-sr-create.job.ts'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  poolId: FrontXoPool['id']
  hostId?: FrontXoHost['id']
}>()

const emit = defineEmits<{
  cancel: []
  confirm: [NewSrRestPayload]
}>()

const { t } = useI18n()

const formRef = useTemplateRef('formRef')

const { open: openEraseConfirmModal } = useOverlay({
  component: () => import('@/modules/storage-repository/components/modal/SrCreateEraseConfirmModal.vue'),
  events: { onConfirm: true, onCancel: true },
})

async function handleConfirm() {
  const restPayload = await formRef.value?.validateAndBuildPayload()

  if (!restPayload) {
    return
  }

  if (formRef.value?.requiresEraseConfirm) {
    const response = await openEraseConfirmModal({ props: { device: restPayload.device_config.device ?? '' } })

    if (response.event !== 'onConfirm') {
      return
    }
  }

  emit('confirm', restPayload)
}
</script>
