<template>
  <UiModal @submit.prevent="handleSubmit()">
    <ConfirmModalLayout :icon="faSatellite">
      <template #title>
        <I18nT keypath="confirm-delete" scope="global" tag="div">
          <span :class="textClass">
            {{ t('n-vms', { n: vmRefs.length }) }}
          </span>
        </I18nT>
      </template>

      <template #subtitle>
        {{ t('please-confirm') }}
      </template>

      <template #buttons>
        <ModalDeclineButton>
          {{ t('go-back') }}
        </ModalDeclineButton>
        <ModalApproveButton>
          {{ t('delete-vms', { n: vmRefs.length }) }}
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
import { useContext } from '@/composables/context.composable'
import { ColorContext } from '@/context'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import { useXenApiStore } from '@/stores/xen-api.store'
import { IK_MODAL } from '@/types/injection-keys'
import { faSatellite } from '@fortawesome/free-solid-svg-icons'
import { inject } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  vmRefs: XenApiVm['$ref'][]
}>()

const { t } = useI18n()

const modal = inject(IK_MODAL)!

const { textClass } = useContext(ColorContext)

const handleSubmit = () => {
  const xenApi = useXenApiStore().getXapi()
  modal.approve(xenApi.vm.delete(props.vmRefs))
}
</script>
