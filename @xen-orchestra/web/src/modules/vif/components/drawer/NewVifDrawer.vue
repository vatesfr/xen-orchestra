<template>
  <UiDrawer class="new-vif-drawer" @confirm="handleConfirm()" @dismiss="emit('cancel')">
    <template #title>{{ t('new-vif:add') }}</template>

    <template #content>
      <UiTitle>{{ t('configuration') }}</UiTitle>
      <VtsRequiredHint class="required-hint" />
      <NewVifForm ref="form" :vm-id :pool-id />
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>{{ t('action:create-vif') }}</VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script lang="ts" setup>
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import NewVifForm from '@/modules/vif/components/form/new/NewVifForm.vue'
import type { NewVifPayload } from '@/modules/vif/jobs/xo-vif-create.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import VtsRequiredHint from '@core/components/required-hint/VtsRequiredHint.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  vmId: FrontXoVm['id']
  poolId: FrontXoPool['id']
}>()

const emit = defineEmits<{
  confirm: [payload: NewVifPayload]
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
.new-vif-drawer {
  .required-hint {
    margin-block: 2.4rem;
  }
}
</style>
