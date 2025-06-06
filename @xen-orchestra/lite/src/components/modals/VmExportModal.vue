<template>
  <UiModal @submit.prevent="handleSubmit">
    <FormModalLayout :icon="faDisplay">
      <template #title>
        {{ t('export-n-vms', { n: vmRefs.length }) }}
      </template>

      <VtsInputWrapper
        learn-more-url="https://xcp-ng.org/blog/2018/12/19/zstd-compression-for-xcp-ng/"
        :label="t('select-compression')"
      >
        <VtsSelect :id="compressionSelectId" accent="brand" />
      </VtsInputWrapper>

      <template #buttons>
        <ModalDeclineButton />
        <ModalApproveButton>
          {{ t('export-n-vms', { n: vmRefs.length }) }}
        </ModalApproveButton>
      </template>
    </FormModalLayout>
  </UiModal>
</template>

<script lang="ts" setup>
import FormModalLayout from '@/components/ui/modals/layouts/FormModalLayout.vue'
import ModalApproveButton from '@/components/ui/modals/ModalApproveButton.vue'
import ModalDeclineButton from '@/components/ui/modals/ModalDeclineButton.vue'
import UiModal from '@/components/ui/modals/UiModal.vue'
import { VM_COMPRESSION_TYPE } from '@/libs/xen-api/xen-api.enums'

import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import { useXenApiStore } from '@/stores/xen-api.store'
import { IK_MODAL } from '@/types/injection-keys'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import { useFormSelect } from '@core/packages/form-select'
import { faDisplay } from '@fortawesome/free-solid-svg-icons'
import { inject, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  vmRefs: XenApiVm['$ref'][]
}>()

const { t } = useI18n()

const modal = inject(IK_MODAL)!

const compressionType = ref(VM_COMPRESSION_TYPE.DISABLED)

const handleSubmit = () => {
  const xenApi = useXenApiStore().getXapi()
  xenApi.vm.export(props.vmRefs, compressionType.value)
  modal.approve()
}

const { id: compressionSelectId } = useFormSelect(Object.keys(VM_COMPRESSION_TYPE), {
  model: compressionType,
  option: {
    label: key => t(key.toLocaleLowerCase()),
    value: key => VM_COMPRESSION_TYPE[key as keyof typeof VM_COMPRESSION_TYPE],
  },
})
</script>
