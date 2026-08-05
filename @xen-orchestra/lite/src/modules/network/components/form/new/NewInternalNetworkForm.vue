<template>
  <form class="new-internal-network-form" novalidate @submit.prevent="onSubmit()">
    <NetworkFormTextInput v-bind="poolInputBindings" class="pool" />
    <div class="row">
      <div class="column">
        <NetworkFormTextInput v-bind="nameInputBindings" />
        <NetworkFormNumberInput v-bind="mtuInputBindings" />
      </div>
      <NewNetworkDescriptionTextarea v-bind="descriptionInputBindings" />
    </div>
    <div class="nbd">
      <NewNetworkNbdCheckbox v-bind="nbdCheckboxBindings" />
    </div>
    <NewNetworkButtonsSection :cancel-to :submit-label="t('action:create-internal-network')" />
  </form>
</template>

<script setup lang="ts">
import NetworkFormNumberInput from '@/modules/network/components/form/new/inputs/NetworkFormNumberInput.vue'
import NetworkFormTextInput from '@/modules/network/components/form/new/inputs/NetworkFormTextInput.vue'
import NewNetworkDescriptionTextarea from '@/modules/network/components/form/new/inputs/NewNetworkDescriptionTextarea.vue'
import NewNetworkNbdCheckbox from '@/modules/network/components/form/new/inputs/NewNetworkNbdCheckbox.vue'
import NewNetworkButtonsSection from '@/modules/network/components/form/new/NewNetworkButtonsSection.vue'
import { useNewInternalNetworkForm } from '@/modules/network/form/new-internal/use-new-internal-network-form.ts'
import type { NewInternalNetworkPayload } from '@/modules/network/jobs/internal-network-create.job.ts'
import { useI18n } from 'vue-i18n'
import type { RouteLocationRaw } from 'vue-router'

defineProps<{
  cancelTo: RouteLocationRaw
}>()

const emit = defineEmits<{
  create: [data: NewInternalNetworkPayload]
}>()

const { t } = useI18n()

const {
  poolInputBindings,
  nameInputBindings,
  mtuInputBindings,
  descriptionInputBindings,
  nbdCheckboxBindings,
  validateAndBuildPayload,
} = useNewInternalNetworkForm()

async function onSubmit() {
  const payload = await validateAndBuildPayload()

  if (payload !== undefined) {
    emit('create', payload)
  }
}
</script>

<style lang="postcss" scoped>
.new-internal-network-form {
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

  @media (--medium-or-large) {
    .pool {
      max-width: 40rem;
    }
  }

  .nbd {
    margin-block-start: 2.4rem;
  }
}
</style>
