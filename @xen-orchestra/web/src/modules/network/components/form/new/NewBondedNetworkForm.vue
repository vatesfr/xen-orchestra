<template>
  <form class="new-bonded-network-form" @submit.prevent="onSubmit()">
    <div class="row">
      <NetworkFormSelect v-bind="poolSelectBindings" />
      <NetworkFormSelect v-bind="interfaceSelectBindings" />
    </div>
    <div class="row">
      <div class="column">
        <NetworkFormTextInput v-bind="nameInputBindings" />
        <NetworkFormNumberInput v-bind="mtuInputBindings" />
      </div>
      <NewNetworkDescriptionTextarea v-bind="descriptionInputBindings" />
    </div>
    <NetworkFormSelect v-bind="bondModeSelectBindings" class="bond-mode" />
    <div class="nbd">
      <NewNetworkNbdCheckbox v-bind="nbdCheckboxBindings" />
    </div>
    <NewNetworkButtonsSection :cancel-to :submit-label="t('action:create-bonded-network')" />
  </form>
</template>

<script lang="ts" setup>
import NetworkFormNumberInput from '@/modules/network/components/form/new/inputs/NetworkFormNumberInput.vue'
import NetworkFormSelect from '@/modules/network/components/form/new/inputs/NetworkFormSelect.vue'
import NetworkFormTextInput from '@/modules/network/components/form/new/inputs/NetworkFormTextInput.vue'
import NewNetworkDescriptionTextarea from '@/modules/network/components/form/new/inputs/NewNetworkDescriptionTextarea.vue'
import NewNetworkNbdCheckbox from '@/modules/network/components/form/new/inputs/NewNetworkNbdCheckbox.vue'
import NewNetworkButtonsSection from '@/modules/network/components/form/new/NewNetworkButtonsSection.vue'
import { useNewBondedNetworkForm } from '@/modules/network/form/new-bonded/use-new-bonded-network-form.ts'
import type { NewBondedNetworkPayload } from '@/modules/network/jobs/xo-bonded-network-create.job.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useI18n } from 'vue-i18n'
import type { RouteLocationRaw } from 'vue-router'

const { poolId, cancelTo } = defineProps<{
  poolId?: FrontXoPool['id']
  cancelTo: RouteLocationRaw
}>()

const emit = defineEmits<{
  create: [data: NewBondedNetworkPayload]
}>()

const { t } = useI18n()

const {
  poolSelectBindings,
  interfaceSelectBindings,
  nameInputBindings,
  mtuInputBindings,
  descriptionInputBindings,
  nbdCheckboxBindings,
  bondModeSelectBindings,
  validateAndBuildPayload,
} = useNewBondedNetworkForm(() => poolId)

async function onSubmit() {
  const payload = await validateAndBuildPayload()

  if (payload !== undefined) {
    emit('create', payload)
  }
}
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
      gap: 8rem;
      max-width: 88rem;
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
