<template>
  <div class="new-bonded-network-form">
    <div class="row">
      <NetworkFormSelect v-bind="poolSelectBindings" />
      <NetworkFormSelect v-bind="interfaceSelectBindings" />
    </div>
    <div class="row">
      <div class="column">
        <NetworkFormTextInput v-bind="nameInputBindings" />
        <VtsNumberInput v-bind="mtuInputBindings" />
      </div>
      <NewNetworkDescriptionTextarea v-bind="descriptionInputBindings" />
    </div>
    <NetworkFormSelect v-bind="bondModeSelectBindings" class="bond-mode" />
    <div class="nbd">
      <NewNetworkNbdRadio v-bind="nbdRadioBindings" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import NetworkFormSelect from '@/modules/network/components/form/new/inputs/NetworkFormSelect.vue'
import NetworkFormTextInput from '@/modules/network/components/form/new/inputs/NetworkFormTextInput.vue'
import NewNetworkDescriptionTextarea from '@/modules/network/components/form/new/inputs/NewNetworkDescriptionTextarea.vue'
import NewNetworkNbdRadio from '@/modules/network/components/form/new/inputs/NewNetworkNbdRadio.vue'
import { useNewBondedNetworkForm } from '@/modules/network/form/new-bonded/use-new-bonded-network-form.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import VtsNumberInput from '@core/components/number-input/VtsNumberInput.vue'

const { poolId } = defineProps<{
  poolId?: FrontXoPool['id']
}>()

const {
  poolSelectBindings,
  interfaceSelectBindings,
  nameInputBindings,
  mtuInputBindings,
  descriptionInputBindings,
  nbdRadioBindings,
  bondModeSelectBindings,
  validateAndBuildPayload,
} = useNewBondedNetworkForm(() => poolId)

defineExpose({
  validate: validateAndBuildPayload,
})
</script>

<style lang="postcss" scoped>
.new-bonded-network-form {
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
    }

    &:not(:first-child) {
      margin-block-start: 2.4rem;
    }

    .column {
      display: flex;
      flex-direction: column;
      gap: 2.4rem;
    }
  }

  .bond-mode,
  .nbd {
    margin-block-start: 2.4rem;
  }

  @media (--medium-or-large) {
    .bond-mode {
      max-width: 40rem;
    }
  }
}
</style>
