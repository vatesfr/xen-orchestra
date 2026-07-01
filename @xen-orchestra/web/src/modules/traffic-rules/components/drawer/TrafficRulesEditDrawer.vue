<template>
  <VtsDrawer class="container" dismissible @dismiss="emit('cancel')">
    <template #title>{{ t('action:update-traffic-rule') }}</template>

    <template #content>
      <UiTitle class="section-title">
        {{ t('general-information') }}
      </UiTitle>

      <span class="typo-form-info required-hint">{{ t('field-required') }}</span>

      <EditTrafficRuleForm :rule />
    </template>

    <template #buttons>
      <VtsDrawerCancelButton />
      <VtsDrawerConfirmButton>
        {{ t('action:save') }}
      </VtsDrawerConfirmButton>
    </template>
  </VtsDrawer>
</template>

<script setup lang="ts">
import EditTrafficRuleForm from '@/modules/traffic-rules/components/form/edit/EditTrafficRuleForm.vue'
import type { VdiExportFormat } from '@/shared/constants.ts'
import VtsDrawer from '@core/components/drawer/VtsDrawer.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import type { TrafficRule } from '@vates/types'
import VtsDrawerCancelButton from '@xen-orchestra/web-core/components/drawer/VtsDrawerCancelButton.vue'
import VtsDrawerConfirmButton from '@xen-orchestra/web-core/components/drawer/VtsDrawerConfirmButton.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  rule: TrafficRule
}>()

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

<style lang="postcss" scoped>
.container {
  .section-title {
    margin-block-end: 2.4rem;
  }

  .required-hint::before {
    content: '* ';
    color: var(--color-brand-txt-base);
  }
}
</style>
