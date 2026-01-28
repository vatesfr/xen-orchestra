<template>
  <VtsModal accent="info" icon="object:vm" @confirm="emit('confirm', compressionType)">
    <template #title>
      {{ t('action:export-n-vms', { n: count }) }}
    </template>
    <template #content>
      <VtsInputWrapper
        :label="t('select-compression')"
        learn-more-url="https://xcp-ng.org/blog/2018/12/19/zstd-compression-for-xcp-ng/"
      >
        <VtsSelect :id="compressionSelectId" accent="brand" />
      </VtsInputWrapper>
    </template>
    <template #buttons>
      <VtsModalCancelButton />
      <VtsModalConfirmButton>
        {{ t('action:export-n-vms', { n: count }) }}
      </VtsModalConfirmButton>
    </template>
  </VtsModal>
</template>

<script lang="ts" setup>
import { VM_COMPRESSION_TYPE } from '@/libs/xen-api/xen-api.enums'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsModal from '@core/components/modal/VtsModal.vue'
import VtsModalCancelButton from '@core/components/modal/VtsModalCancelButton.vue'
import VtsModalConfirmButton from '@core/components/modal/VtsModalConfirmButton.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import { useFormSelect } from '@core/packages/form-select'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  count: number
}>()

const emit = defineEmits<{
  confirm: [compressionType: VM_COMPRESSION_TYPE]
}>()

const { t } = useI18n()

const compressionType = ref(VM_COMPRESSION_TYPE.DISABLED)

const { id: compressionSelectId } = useFormSelect(Object.keys(VM_COMPRESSION_TYPE), {
  model: compressionType,
  option: {
    label: key => t(key.toLocaleLowerCase()),
    value: key => VM_COMPRESSION_TYPE[key as keyof typeof VM_COMPRESSION_TYPE],
  },
})
</script>
