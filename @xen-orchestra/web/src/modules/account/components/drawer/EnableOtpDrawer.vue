<template>
  <UiDrawer @confirm="onConfirm()" @dismiss="emit('cancel')">
    <template #title>{{ t('action:enable-otp-authentication') }}</template>

    <template #content>
      <div class="enable-otp-drawer">
        <div class="section">
          <UiTitle>{{ t('otp-scan-qr-code') }}</UiTitle>
          <img v-if="qrCodeUrl" :src="qrCodeUrl" :alt="t('otp-qr-code-alt')" class="qr-code" />
          <UiInfo accent="info" wrap>{{ t('otp-secret-manual') }}</UiInfo>
          <div class="secret">
            <UiTag accent="neutral" variant="secondary">
              <span class="typo-body-bold">{{ secret }}</span>
            </UiTag>
            <VtsCopyButton :value="secret" />
          </div>
        </div>

        <div class="section">
          <UiTitle>{{ t('otp-enter-verification-code') }}</UiTitle>
          <VtsRequiredHint />
          <FormTextInput v-bind="codeInputBindings" />
        </div>
      </div>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>
        {{ t('action:enable') }}
      </VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script setup lang="ts">
import { useEnableOtpForm } from '@/modules/account/form/use-enable-otp-form.ts'
import FormTextInput from '@/shared/components/form/FormTextInput.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import VtsRequiredHint from '@core/components/required-hint/VtsRequiredHint.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import type { XoUser } from '@vates/types'
import { useI18n } from 'vue-i18n'

const { user } = defineProps<{
  user: XoUser
}>()

const emit = defineEmits<{
  cancel: []
  confirm: [secret: string]
}>()

const { t } = useI18n()

const { secret, qrCodeUrl, codeInputBindings, validateAndGetSecret } = useEnableOtpForm(() => user)

async function onConfirm() {
  const validSecret = await validateAndGetSecret()

  if (validSecret !== undefined) {
    emit('confirm', validSecret)
  }
}
</script>

<style lang="postcss" scoped>
.enable-otp-drawer {
  display: flex;
  flex-direction: column;
  gap: 4.8rem;
  margin-block-start: 2.4rem;

  .section {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
  }

  .qr-code {
    align-self: flex-start;
    width: 20rem;
    height: 20rem;
  }

  .secret {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }
}
</style>
