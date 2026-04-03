<template>
  <form class="new-vif-form" @submit.prevent="onSubmit()">
    <div class="row">
      <NewVifNetworkSelect v-bind="networkSelectBindings" />
      <NewVifMacInput v-bind="macInputBindings" />
    </div>
    <div class="row">
      <NewVifRateLimitInput v-bind="rateLimitInputBindings" />
      <NewVifAllowedIpsTextarea v-bind="allowedIpsTextareaBindings" />
    </div>
    <div class="tx-checksumming">
      <NewVifTxChecksummingCheckbox v-bind="txChecksummingCheckboxBindings" />
    </div>
    <NewVifButtonsSection :cancel-to />
  </form>
</template>

<script setup lang="ts">
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import NewVifAllowedIpsTextarea from '@/modules/vif/components/form/new/inputs/NewVifAllowedIpsTextarea.vue'
import NewVifMacInput from '@/modules/vif/components/form/new/inputs/NewVifMacInput.vue'
import NewVifNetworkSelect from '@/modules/vif/components/form/new/inputs/NewVifNetworkSelect.vue'
import NewVifRateLimitInput from '@/modules/vif/components/form/new/inputs/NewVifRateLimitInput.vue'
import NewVifTxChecksummingCheckbox from '@/modules/vif/components/form/new/inputs/NewVifTxChecksummingCheckbox.vue'
import NewVifButtonsSection from '@/modules/vif/components/form/new/NewVifButtonsSection.vue'
import { type NewVifPayload, useNewVifForm } from '@/modules/vif/form/new/use-new-vif-form.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'

import type { RouteLocationRaw } from 'vue-router'

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

function onSubmit() {
  const payload = validateAndBuildPayload()

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
