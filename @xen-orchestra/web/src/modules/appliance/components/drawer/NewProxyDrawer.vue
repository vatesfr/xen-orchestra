<template>
  <UiDrawer class="new-proxy-drawer" @confirm="handleConfirm()" @dismiss="emit('cancel')">
    <template #title>{{ t('action:add-proxy') }}</template>

    <template #content>
      <UiAlert accent="info">
        <span class="typo-body-bold">{{ t('appliance:proxy-only-without-internet') }}</span>
        <template #description>{{ t('appliance:proxy-only-without-internet-description') }}</template>
      </UiAlert>
      <VtsRequiredHint class="required-hint" />
      <NewProxyForm ref="form" />
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>{{ t('action:add-proxy') }}</VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script lang="ts" setup>
import NewProxyForm from '@/modules/appliance/components/form/new-proxy/NewProxyForm.vue'
import type { XoaProxyPayload } from '@/modules/appliance/types/xoa-proxy.type.ts'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import VtsRequiredHint from '@core/components/required-hint/VtsRequiredHint.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import { useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

const emit = defineEmits<{
  confirm: [payload: XoaProxyPayload]
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
.new-proxy-drawer {
  .required-hint {
    margin-block: 2.4rem;
  }
}
</style>
