<template>
  <form class="new-network-form" @submit.prevent="onSubmit()">
    <div class="row">
      <NewNetworkPoolSelect :id="poolSelectId" />
      <NewNetworkInterfaceSelect :id="interfacesSelectId" />
    </div>
    <div class="row">
      <div class="column">
        <NewNetworkNameInput v-model="formData.name" />
        <NewNetworkMtuInput v-model="formData.mtu" />
      </div>
      <NewNetworkDescriptionTextarea v-model="formData.description" />
    </div>
    <NewNetworkVlanInput v-model="formData.vlan" class="vlan" />
    <div class="nbd">
      <NewNetworkNbdCheckbox v-model="formData.nbd" />
    </div>
    <NewNetworkButtonsSection :cancel-to :submit-label="t('action:create-network')" />
  </form>
</template>

<script lang="ts" setup>
import NewNetworkDescriptionTextarea from '@/modules/network/components/form/new/inputs/NewNetworkDescriptionTextarea.vue'
import NewNetworkInterfaceSelect from '@/modules/network/components/form/new/inputs/NewNetworkInterfaceSelect.vue'
import NewNetworkMtuInput from '@/modules/network/components/form/new/inputs/NewNetworkMtuInput.vue'
import NewNetworkNameInput from '@/modules/network/components/form/new/inputs/NewNetworkNameInput.vue'
import NewNetworkNbdCheckbox from '@/modules/network/components/form/new/inputs/NewNetworkNbdCheckbox.vue'
import NewNetworkPoolSelect from '@/modules/network/components/form/new/inputs/NewNetworkPoolSelect.vue'
import NewNetworkVlanInput from '@/modules/network/components/form/new/inputs/NewNetworkVlanInput.vue'
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

const { formData, poolSelectId, interfacesSelectId, validateAndBuildPayload } = useNewNetworkForm(() => poolId)

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
