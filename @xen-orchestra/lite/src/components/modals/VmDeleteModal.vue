<template>
  <UiModal @submit.prevent="handleSubmit()">
    <ConfirmModalLayout :icon="faSatellite">
      <template #title>
        <i18n-t keypath="confirm-delete" scope="global" tag="div">
          <!-- TODO : update to UiAccent component when available -->
          <span class="vm-number" :class="color">
            {{ $t('n-vms', { n: vmRefs.length }) }}
          </span>
        </i18n-t>
      </template>

      <template #subtitle>
        {{ $t('please-confirm') }}
      </template>

      <template #buttons>
        <ModalDeclineButton>
          {{ $t('go-back') }}
        </ModalDeclineButton>
        <ModalApproveButton>
          {{ $t('delete-vms', { n: vmRefs.length }) }}
        </ModalApproveButton>
      </template>
    </ConfirmModalLayout>
  </UiModal>
</template>

<script lang="ts" setup>
import ConfirmModalLayout from '@/components/ui/modals/layouts/ConfirmModalLayout.vue'
import ModalApproveButton from '@/components/ui/modals/ModalApproveButton.vue'
import ModalDeclineButton from '@/components/ui/modals/ModalDeclineButton.vue'
import UiModal from '@/components/ui/modals/UiModal.vue'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import { useXenApiStore } from '@/stores/xen-api.store'
import { IK_MODAL } from '@/types/injection-keys'
import { useContext } from '@core/composables/context.composable'
import { ColorContext } from '@core/context'
import { faSatellite } from '@fortawesome/free-solid-svg-icons'
import { inject } from 'vue'

const props = defineProps<{
  vmRefs: XenApiVm['$ref'][]
}>()

const modal = inject(IK_MODAL)!

const color = useContext(ColorContext)

const handleSubmit = () => {
  const xenApi = useXenApiStore().getXapi()
  modal.approve(xenApi.vm.delete(props.vmRefs))
}
</script>

<style lang="postcss" scoped>
.vm-number {
  color: var(--color);
  --color: var(--color-grey-600);

  &.info {
    --color: var(--color-purple-base);
  }

  &.success {
    --color: var(--color-green-base);
  }

  &.warning {
    --color: var(--color-orange-base);
  }

  &.error,
  &.danger {
    --color: var(--color-red-base);
  }
}
</style>
