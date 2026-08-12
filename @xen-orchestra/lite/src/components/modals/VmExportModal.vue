<template>
  <UiModal accent="info" icon="object:vm" @confirm="emit('confirm', compressionType)" @dismiss="emit('cancel')">
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
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>
        {{ t('action:export-n-vms', { n: count }) }}
      </VtsOverlayConfirmButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import { VM_COMPRESSION_TYPE } from '@/libs/xen-api/xen-api.enums'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import UiModal from '@core/components/ui/modal/UiModal.vue'
import { useFormSelect } from '@core/packages/form-select'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  count: number
}>()

const emit = defineEmits<{
  confirm: [compressionType: VM_COMPRESSION_TYPE]
  cancel: []
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
