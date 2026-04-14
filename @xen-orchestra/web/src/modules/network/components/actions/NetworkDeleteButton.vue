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
import { type NetworkDeleteModalProps } from '@/modules/network/components/modal/NetworkDeleteModal.vue'
import { NETWORK_DELETE_ERROR, useXoNetworkDeleteJob } from '@/modules/network/jobs/xo-network-delete.job.ts'
import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { getNetworkType } from '@/modules/network/utils/xo-network.util.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { useModal } from '@core/packages/modal/use-modal.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { network } = defineProps<{
  network: FrontXoNetwork
}>()

const { t } = useI18n()

const { run: deleteNetwork, canRun, isRunning, errorMessage, error } = useXoNetworkDeleteJob(() => [network])

const networkType = computed<NetworkDeleteModalProps['type']>(() => getNetworkType(network))

const openNetworkDeleteModal = useModal({
  component: import('@/modules/network/components/modal/NetworkDeleteModal.vue'),
  props: { count: 1, type: networkType },
  onConfirm: async () => {
    await deleteNetwork()
  },
})

const openNetworkDeleteErrorModal = useModal({
  component: import('@/modules/network/components/modal/NetworkDeleteErrorModal.vue'),
  props: {
    error: errorMessage,
    showConnectedVifsMessage: computed(() => error.value?.jobName === NETWORK_DELETE_ERROR.VIFS_IN_USE),
  },
})

function openModal() {
  if (!canRun.value) {
    openNetworkDeleteErrorModal()
  } else {
    openNetworkDeleteModal()
  }
}
</script>
