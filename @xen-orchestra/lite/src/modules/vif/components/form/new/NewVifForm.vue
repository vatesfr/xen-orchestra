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
    <NewVifButtonsSection :cancel-to />
  </VtsForm>
</template>

<script setup lang="ts">
import type { XenApiVm } from '@/libs/xen-api/xen-api.types.ts'
import VifAllowedIpsTextarea from '@/modules/vif/components/form/new/inputs/VifAllowedIpsTextarea.vue'
import VifMacInput from '@/modules/vif/components/form/new/inputs/VifMacInput.vue'
import NewVifButtonsSection from '@/modules/vif/components/form/new/NewVifButtonsSection.vue'
import { useNewVifForm } from '@/modules/vif/form/new/use-new-vif-form.ts'
import type { NewVifPayload } from '@/modules/vif/jobs/vif-create.job.ts'
import VtsForm from '@core/components/form/VtsForm.vue'
import type { RouteLocationRaw } from 'vue-router'
import VifNetworkSelect from './inputs/VifNetworkSelect.vue'
import VifRateLimitInput from './inputs/VifRateLimitInput.vue'
import VifTxChecksummingCheckbox from './inputs/VifTxChecksummingCheckbox.vue'

const { vmRef } = defineProps<{
  vmRef: XenApiVm['$ref']
  cancelTo: RouteLocationRaw
}>()

const emit = defineEmits<{
  create: [data: NewVifPayload]
}>()

const {
  networkSelectBindings,
  macInputBindings,
  rateLimitInputBindings,
  allowedIpsTextareaBindings,
  txChecksummingCheckboxBindings,
  validateAndBuildPayload,
} = useNewVifForm(() => vmRef)

async function onSubmit() {
  const payload = await validateAndBuildPayload()

  if (payload !== undefined) {
    emit('create', payload)
  }
}
</script>

<style lang="postcss" scoped>
.new-vif-form {
  @media (--medium-or-large) {
    max-width: 88rem;
  }

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
