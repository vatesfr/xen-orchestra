<template>
  <UiDrawer @dismiss="emit('cancel')" @confirm="emit('confirm', exportFormat)">
    <template #title>{{ t('action:export-content') }}</template>

    <template #content>
      <VtsInputWrapper :label="t('select-format')" wrap-message>
        <VtsSelect :id="exportFormatSelectedId" accent="brand" />
      </VtsInputWrapper>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>
        {{ t('action:export-vdi') }}
      </VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script setup lang="ts">
import type { VdiExportFormat } from '@/shared/constants.ts'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import { useFormSelect } from '@core/packages/form-select'
import { SUPPORTED_VDI_FORMAT } from '@vates/types'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const emit = defineEmits<{
  cancel: []
  confirm: [exportFormat: VdiExportFormat]
}>()

const { t } = useI18n()

const exportFormat = ref<VdiExportFormat>(SUPPORTED_VDI_FORMAT.vhd)

const options = Object.entries(SUPPORTED_VDI_FORMAT)
  .filter(([, value]) => value !== SUPPORTED_VDI_FORMAT.qcow2)
  .map(([key, value]) => ({
    value,
    label: key,
  }))

const { id: exportFormatSelectedId } = useFormSelect(options, {
  model: exportFormat,
  option: {
    id: 'value',
    value: 'value',
  },
})
</script>
