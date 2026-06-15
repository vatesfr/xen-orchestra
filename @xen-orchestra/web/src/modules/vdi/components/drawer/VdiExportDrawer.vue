<template>
  <VtsDrawer dismissible is-open>
    <template #title>{{ t('action:export-content') }}</template>

    <template #content>
      <div class="form">
        <div class="field">
          <VtsInputWrapper :label="t('select-format')" wrap-message>
            <VtsSelect :id="exportFormatSelectedId" accent="brand" />
          </VtsInputWrapper>
        </div>
      </div>
    </template>

    <template #buttons>
      <VtsDrawerCancelButton />
      <VtsDrawerConfirmButton @click="handleConfirm">
        {{ t('action:export-vdi') }}
      </VtsDrawerConfirmButton>
    </template>
  </VtsDrawer>
</template>

<script setup lang="ts">
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { VDI_EXPORT_FORMAT, type VdiExportFormat } from '@/shared/constants.ts'
import VtsDrawer from '@core/components/drawer/VtsDrawer.vue'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import { useFormSelect } from '@core/packages/form-select'
import VtsDrawerCancelButton from '@xen-orchestra/web-core/components/drawer/VtsDrawerCancelButton.vue'
import VtsDrawerConfirmButton from '@xen-orchestra/web-core/components/drawer/VtsDrawerConfirmButton.vue'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  vdi: FrontXoVdi
}>()

const emit = defineEmits<{
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
