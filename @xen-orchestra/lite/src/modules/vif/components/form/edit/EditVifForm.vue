<template>
  <VtsForm class="new-vif-form" @submit="onSubmit()">
    <div class="row">
      <VifNetworkSelect v-bind="networkSelectBindings" />
      <VifMacInput v-bind="macInputBindings" />
    </div>
    <div class="row">
      <VifRateLimitInput v-bind="rateLimitInputBindings" />
      <VifAllowedIpsTextarea v-bind="allowedIpsTextareaBindings" />
    </div>
    <div class="tx-checksumming">
      <VifTxChecksummingCheckbox v-bind="txChecksummingCheckboxBindings" />
    </div>
    <EditVifButtonsSection :cancel-to />
  </VtsForm>
</template>

<script setup lang="ts">
import type { XenApiVif, XenApiVm } from '@/libs/xen-api/xen-api.types'
import { useEditVifForm } from '@/modules/vif/form/edit/use-edit-vif-form.ts'
import type { EditVifPayload } from '@/modules/vif/jobs/xen-api-vif-edit.job.ts'
import VtsForm from '@core/components/form/VtsForm.vue'
import type { RouteLocationRaw } from 'vue-router'
import EditVifButtonsSection from './EditVifButtonsSection.vue'
import VifAllowedIpsTextarea from './inputs/VifAllowedIpsTextarea.vue'
import VifMacInput from './inputs/VifMacInput.vue'
import VifNetworkSelect from './inputs/VifNetworkSelect.vue'
import VifRateLimitInput from './inputs/VifRateLimitInput.vue'
import VifTxChecksummingCheckbox from './inputs/VifTxChecksummingCheckbox.vue'

const { vmRef, vifRef } = defineProps<{
  vmRef: XenApiVm['$ref']
  vifRef: XenApiVif['$ref']
  cancelTo: RouteLocationRaw
}>()

const emit = defineEmits<{
  edit: [data: EditVifPayload]
}>()

const {
  networkSelectBindings,
  macInputBindings,
  rateLimitInputBindings,
  allowedIpsTextareaBindings,
  txChecksummingCheckboxBindings,
  validateAndBuildPayload,
} = useEditVifForm(vmRef, vifRef)

async function onSubmit() {
  const payload = await validateAndBuildPayload()

  if (payload !== undefined) {
    emit('edit', payload)
  }
}
</script>

<style lang="postcss" scoped>
.new-vif-form {
  .row {
    display: flex;
    align-items: start;
    flex-direction: column;
    gap: 2.4rem;

    & > * {
      width: 100%;
      min-width: 0;
    }

    @media (--medium-or-large) {
      flex-direction: row;
      gap: 8rem;
      max-width: 88rem;
    }

    &:not(:first-child) {
      margin-block-start: 2.4rem;
    }
  }

  .tx-checksumming {
    margin-block-start: 2.4rem;
  }
}
</style>
