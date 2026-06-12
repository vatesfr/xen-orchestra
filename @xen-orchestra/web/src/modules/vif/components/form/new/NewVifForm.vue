<template>
  <VtsForm class="new-vif-form" @submit="onSubmit()">
    <div class="row">
      <VifNetworkSelect v-bind="networkSelectBindings" />
      <NewVifMacInput v-bind="macInputBindings" />
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
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import NewVifMacInput from '@/modules/vif/components/form/new/inputs/NewVifMacInput.vue'
import NewVifButtonsSection from '@/modules/vif/components/form/new/NewVifButtonsSection.vue'
import { type NewVifPayload, useNewVifForm } from '@/modules/vif/form/new/use-new-vif-form.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsForm from '@core/components/form/VtsForm.vue'

import type { RouteLocationRaw } from 'vue-router'
import VifAllowedIpsTextarea from './inputs/VifAllowedIpsTextarea.vue'
import VifNetworkSelect from './inputs/VifNetworkSelect.vue'
import VifRateLimitInput from './inputs/VifRateLimitInput.vue'
import VifTxChecksummingCheckbox from './inputs/VifTxChecksummingCheckbox.vue'

const { vmId, poolId } = defineProps<{
  vmId: FrontXoVm['id']
  poolId: FrontXoPool['id']
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
} = useNewVifForm(
  () => vmId,
  () => poolId
)

async function onSubmit() {
  const payload = await validateAndBuildPayload()

  if (payload !== undefined) {
    emit('create', payload)
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
