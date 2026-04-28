<template>
  <form class="new-network-form" @submit.prevent="onSubmit()">
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
    <NetworkFormNumberInput v-bind="vlanInputBindings" class="vlan" />
    <div class="nbd">
      <NewNetworkNbdCheckbox v-bind="nbdCheckboxBindings" />
    </div>
    <NewNetworkButtonsSection :cancel-to :submit-label="t('action:create-network')" />
  </form>
</template>

<script lang="ts" setup>
import NetworkFormNumberInput from '@/modules/network/components/form/new/inputs/NetworkFormNumberInput.vue'
import NetworkFormSelect from '@/modules/network/components/form/new/inputs/NetworkFormSelect.vue'
import NetworkFormTextInput from '@/modules/network/components/form/new/inputs/NetworkFormTextInput.vue'
import NewNetworkDescriptionTextarea from '@/modules/network/components/form/new/inputs/NewNetworkDescriptionTextarea.vue'
import NewNetworkNbdCheckbox from '@/modules/network/components/form/new/inputs/NewNetworkNbdCheckbox.vue'
import NewNetworkButtonsSection from '@/modules/network/components/form/new/NewNetworkButtonsSection.vue'
import { useNewNetworkForm } from '@/modules/network/form/new/use-new-network-form.ts'
import type { NewNetworkPayload } from '@/modules/network/jobs/xo-network-create.job.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useI18n } from 'vue-i18n'
import type { RouteLocationRaw } from 'vue-router'

const { poolId } = defineProps<{
  poolId?: FrontXoPool['id']
  cancelTo: RouteLocationRaw
}>()

const emit = defineEmits<{
  create: [data: NewNetworkPayload]
}>()

const { t } = useI18n()

const {
  poolSelectBindings,
  interfaceSelectBindings,
  nameInputBindings,
  mtuInputBindings,
  descriptionInputBindings,
  vlanInputBindings,
  nbdCheckboxBindings,
  validateAndBuildPayload,
} = useNewNetworkForm(() => poolId)

async function onSubmit() {
  const payload = await validateAndBuildPayload()

  if (payload !== undefined) {
    emit('create', payload)
  }
}
</script>

<style lang="postcss" scoped>
.new-network-form {
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

  .vlan,
  .nbd {
    margin-block-start: 2.4rem;
  }

  @media (--medium-or-large) {
    .vlan {
      max-width: 40rem;
    }
  }
}
</style>
