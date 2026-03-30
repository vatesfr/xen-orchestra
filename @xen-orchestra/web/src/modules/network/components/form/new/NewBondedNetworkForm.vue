<template>
  <form class="new-bonded-network-form" @submit.prevent="onSubmit()">
    <div class="row">
      <NewNetworkPoolSelect :id="poolSelectId" />
      <NewBondedNetworkInterfacesSelect :id="interfacesSelectId" />
    </div>
    <div class="row">
      <div class="column">
        <NewNetworkNameInput v-model="formData.name" />
        <NewNetworkMtuInput v-model="formData.mtu" />
      </div>
      <NewNetworkDescriptionTextarea v-model="formData.description" />
    </div>
    <NewBondedNetworkBondModeSelect :id="bondModeSelectId" class="bond-mode" />
    <div class="nbd">
      <NewNetworkNbdCheckbox v-model="formData.nbd" />
    </div>
    <NewNetworkButtonsSection :cancel-to :submit-label="t('action:create-bonded-network')" />
  </form>
</template>

<script lang="ts" setup>
import NewBondedNetworkBondModeSelect from '@/modules/network/components/form/new/inputs/NewBondedNetworkBondModeSelect.vue'
import NewBondedNetworkInterfacesSelect from '@/modules/network/components/form/new/inputs/NewBondedNetworkInterfacesSelect.vue'
import NewNetworkDescriptionTextarea from '@/modules/network/components/form/new/inputs/NewNetworkDescriptionTextarea.vue'
import NewNetworkMtuInput from '@/modules/network/components/form/new/inputs/NewNetworkMtuInput.vue'
import NewNetworkNameInput from '@/modules/network/components/form/new/inputs/NewNetworkNameInput.vue'
import NewNetworkNbdCheckbox from '@/modules/network/components/form/new/inputs/NewNetworkNbdCheckbox.vue'
import NewNetworkPoolSelect from '@/modules/network/components/form/new/inputs/NewNetworkPoolSelect.vue'
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

const { formData, poolSelectId, interfacesSelectId, bondModeSelectId, validateAndBuildPayload } =
  useNewBondedNetworkForm(() => poolId)

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
