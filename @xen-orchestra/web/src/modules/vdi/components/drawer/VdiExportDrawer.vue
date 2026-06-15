<template>
  <VtsDrawer dismissible is-open @dismiss="emit('cancel')">
    <template #title>{{ t('action:export-content') }}</template>

    <template #content>
      <VtsInputWrapper :label="t('select-format')" wrap-message>
        <VtsSelect :id="exportFormatSelectedId" accent="brand" />
      </VtsInputWrapper>
    </template>

    <template #buttons>
      <VtsDrawerCancelButton />
      <VtsDrawerConfirmButton @click="handleConfirm()">
        {{ t('action:export-vdi') }}
      </VtsDrawerConfirmButton>
    </template>
  </VtsDrawer>
</template>

<script setup lang="ts">
import { VDI_EXPORT_FORMAT, type VdiExportFormat } from '@/shared/constants.ts'
import VtsDrawer from '@core/components/drawer/VtsDrawer.vue'
import VtsDrawerCancelButton from '@core/components/drawer/VtsDrawerCancelButton.vue'
import VtsDrawerConfirmButton from '@core/components/drawer/VtsDrawerConfirmButton.vue'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import { useFormSelect } from '@core/packages/form-select'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const emit = defineEmits<{
  cancel: []
  confirm: [exportFormat: VdiExportFormat]
}>()

const { t } = useI18n()

const exportFormat = ref<VdiExportFormat>(VDI_EXPORT_FORMAT.VHD)

const options = Object.entries(VDI_EXPORT_FORMAT).map(([key, value]) => ({
  value,
  label: key,
}))

const { id: exportFormatSelectedId } = useFormSelect(options, {
  model: exportFormat,
  option: {
    id: 'value',
    value: 'value',
    label: 'label',
  },
})

function handleConfirm() {
  emit('confirm', exportFormat.value)
}
</script>
