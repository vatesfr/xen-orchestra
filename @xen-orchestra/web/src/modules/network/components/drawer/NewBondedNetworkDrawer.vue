<template>
  <UiDrawer class="new-bonded-network-drawer" @confirm="handleConfirm()" @dismiss="emit('cancel')">
    <template #title>{{ t('new-network:add-bonded') }}</template>

    <template #content>
      <UiTitle>{{ t('configuration') }}</UiTitle>
      <VtsRequiredHint class="required-hint" />
      <NewBondedNetworkForm ref="form" :pool-id />
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>{{ t('action:create-bonded-network') }}</VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script lang="ts" setup>
import NewBondedNetworkForm from '@/modules/network/components/form/new/NewBondedNetworkForm.vue'
import type { NewBondedNetworkPayload } from '@/modules/network/jobs/xo-bonded-network-create.job.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import VtsRequiredHint from '@core/components/required-hint/VtsRequiredHint.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  poolId: FrontXoPool['id']
}>()

const emit = defineEmits<{
  confirm: [payload: NewBondedNetworkPayload]
  cancel: []
}>()

const { t } = useI18n()

const form = useTemplateRef('form')

async function handleConfirm() {
  const payload = await form.value?.validate()

  if (payload !== undefined) {
    emit('confirm', payload)
  }
}
</script>

<style lang="postcss" scoped>
.new-bonded-network-drawer {
  .required-hint {
    margin-block: 2.4rem;
  }
}
</style>
