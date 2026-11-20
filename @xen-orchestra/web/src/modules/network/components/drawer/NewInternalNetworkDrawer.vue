<template>
  <UiDrawer class="new-internal-network-drawer" @confirm="handleConfirm()" @dismiss="emit('cancel')">
    <template #title>{{ t('new-network:add-internal') }}</template>

    <template #content>
      <UiTitle class="section-title">{{ t('configuration') }}</UiTitle>
      <NewInternalNetworkForm ref="form" :pool-id />
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>{{ t('action:create-internal-network') }}</VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script lang="ts" setup>
import NewInternalNetworkForm from '@/modules/network/components/form/new/NewInternalNetworkForm.vue'
import type { NewInternalNetworkPayload } from '@/modules/network/jobs/xo-internal-network-create.job.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  poolId: FrontXoPool['id']
}>()

const emit = defineEmits<{
  confirm: [payload: NewInternalNetworkPayload]
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
.new-internal-network-drawer {
  .section-title {
    margin-block-end: 2.4rem;
  }
}
</style>
