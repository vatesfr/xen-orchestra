<template>
  <UiButton
    variant="tertiary"
    size="medium"
    accent="danger"
    left-icon="action:delete"
    :busy="isRunning"
    class="delete"
    @click="openModal()"
  >
    {{ t('action:delete') }}
  </UiButton>
</template>

<script setup lang="ts">
import { useXoNetworkDeleteJob } from '@/modules/network/jobs/xo-network-delete.job.ts'
import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { useModal } from '@core/packages/modal/use-modal.ts'
import { useI18n } from 'vue-i18n'

const { network } = defineProps<{
  network: FrontXoNetwork
}>()

const { t } = useI18n()

const { run: deleteNetwork, canRun, isRunning, errorMessage } = useXoNetworkDeleteJob(() => [network])

const openDeleteModal = useModal({
  component: import('@/modules/network/components/modal/NetworkDeleteModal.vue'),
  props: { count: 1 },
  onConfirm: async () => {
    await deleteNetwork()
  },
})

const openErrorModal = useModal((title: string, error: string) => ({
  component: import('@core/components/modal/VtsErrorModal.vue'),
  props: { title, error },
}))

function openModal() {
  if (!canRun.value) {
    openErrorModal(t('unable-to-delete-network'), errorMessage.value || t('error'))
  } else {
    openDeleteModal()
  }
}
</script>
