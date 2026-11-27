<template>
  <UiDrawer class="edit-proxy-drawer" @confirm="handleConfirm()" @dismiss="emit('cancel')">
    <template #title>{{ t('action:edit-proxy') }}</template>

    <template #content>
      <UiAlert accent="info">
        <span class="typo-body-bold">{{ t('appliance:proxy-only-without-internet') }}</span>
        <template #description>{{ t('appliance:proxy-only-without-internet-description') }}</template>
      </UiAlert>
      <VtsRequiredHint class="required-hint" />
      <EditProxyForm ref="form" :proxy />
    </template>

    <template #buttons>
      <UiButton accent="danger" left-icon="action:delete" size="medium" variant="tertiary" @click="emit('remove')">
        {{ t('action:remove-proxy') }}
      </UiButton>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>{{ t('action:save') }}</VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script lang="ts" setup>
import EditProxyForm from '@/modules/appliance/components/form/edit-proxy/EditProxyForm.vue'
import type { XoaProxy, XoaProxyPayload } from '@/modules/appliance/types/xoa-proxy.type.ts'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import VtsRequiredHint from '@core/components/required-hint/VtsRequiredHint.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import { useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  proxy: XoaProxy
}>()

const emit = defineEmits<{
  confirm: [payload: XoaProxyPayload]
  remove: []
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
.edit-proxy-drawer {
  .required-hint {
    margin-block: 2.4rem;
  }
}
</style>
