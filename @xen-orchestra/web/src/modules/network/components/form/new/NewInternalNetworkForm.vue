<template>
  <form class="new-internal-network-form" @submit.prevent="onSubmit()">
    <div class="row pool">
      <NewNetworkPoolSelect :id="poolSelectId" />
    </div>
    <div class="row">
      <div class="column">
        <NewNetworkNameInput v-model="formData.name" />
        <NewNetworkMtuInput v-model="formData.mtu" />
      </div>
      <NewNetworkDescriptionTextarea v-model="formData.description" />
    </div>
    <div class="nbd">
      <NewNetworkNbdCheckbox v-model="formData.nbd" />
    </div>
    <NewNetworkButtonsSection :cancel-to :submit-label="t('action:create-internal-network')" />
  </form>
</template>

<script lang="ts" setup>
import NewNetworkDescriptionTextarea from '@/modules/network/components/form/new/inputs/NewNetworkDescriptionTextarea.vue'
import NewNetworkMtuInput from '@/modules/network/components/form/new/inputs/NewNetworkMtuInput.vue'
import NewNetworkNameInput from '@/modules/network/components/form/new/inputs/NewNetworkNameInput.vue'
import NewNetworkNbdCheckbox from '@/modules/network/components/form/new/inputs/NewNetworkNbdCheckbox.vue'
import NewNetworkPoolSelect from '@/modules/network/components/form/new/inputs/NewNetworkPoolSelect.vue'
import NewNetworkButtonsSection from '@/modules/network/components/form/new/NewNetworkButtonsSection.vue'
import { useNewInternalNetworkForm } from '@/modules/network/form/new-internal/use-new-internal-network-form.ts'
import type { NewInternalNetworkPayload } from '@/modules/network/jobs/xo-internal-network-create.job.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useI18n } from 'vue-i18n'
import type { RouteLocationRaw } from 'vue-router'

const { poolId, cancelTo } = defineProps<{
  poolId?: FrontXoPool['id']
  cancelTo: RouteLocationRaw
}>()

const emit = defineEmits<{
  create: [data: NewInternalNetworkPayload]
}>()

const { t } = useI18n()

const { formData, poolSelectId, validateAndBuildPayload } = useNewInternalNetworkForm(() => poolId)

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
    gap: 8rem;
    max-width: 88rem;

    @media (--small) {
      flex-direction: column;
      gap: 2.4rem;
    }

    & > * {
      flex: 1 0 0;
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

  .pool {
    max-width: 40rem;
  }

  .nbd {
    margin-block-start: 2.4rem;
  }
}
</style>
