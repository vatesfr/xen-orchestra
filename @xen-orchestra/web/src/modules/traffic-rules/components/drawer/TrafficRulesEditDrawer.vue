<template>
  <VtsDrawer dismissible @dismiss="emit('cancel')">
    <template #title>{{ t('action:update-traffic-rule') }}</template>

    <template #content>
      <UiTitle>
        {{ t('general-information') }}
      </UiTitle>
    </template>

    <template #buttons>
      <!--      <VtsDrawerCancelButton /> -->
      <!--      <VtsDrawerConfirmButton :on-click="handleConfirm"> -->
      <!--        {{ t('action:export-vdi') }} -->
      <!--      </VtsDrawerConfirmButton> -->
    </template>
  </VtsDrawer>
</template>

<script setup lang="ts">
import type { VdiExportFormat } from '@/shared/constants.ts'
import VtsDrawer from '@core/components/drawer/VtsDrawer.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

const emit = defineEmits<{
  cancel: []
  confirm: [exportFormat: VdiExportFormat]
}>()

const { t } = useI18n()

// const exportFormat = ref<VdiExportFormat>(SUPPORTED_VDI_FORMAT.vhd)
//
// const options = Object.entries(SUPPORTED_VDI_FORMAT)
//   .filter(([, value]) => value !== SUPPORTED_VDI_FORMAT.qcow2)
//   .map(([key, value]) => ({
//     value,
//     label: key,
//   }))

// const { id: exportFormatSelectedId } = useFormSelect(options, {
//   model: exportFormat,
//   option: {
//     id: 'value',
//     value: 'value',
//   },
// })
//
// function handleConfirm() {
//   emit('confirm', exportFormat.value)
// }
</script>
