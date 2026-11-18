<template>
  <VtsActionButton
    :hint="editOtpErrorMessage"
    variant="secondary"
    accent="brand"
    :disabled="!canEditOtp"
    :busy="isEditingOtp"
    @click="toggleOtp()"
  >
    {{ isOtpEnabled ? t('action:disable') : t('action:enable') }}
  </VtsActionButton>
</template>

<script lang="ts" setup>
import { useAccountOtp } from '@/modules/account/composables/use-account-otp.composable.ts'
import VtsActionButton from '@core/components/action-button/VtsActionButton.vue'
import type { XoUser } from '@vates/types'
import { useI18n } from 'vue-i18n'

const { user } = defineProps<{
  user: XoUser
}>()

const { t } = useI18n()

const { isOtpEnabled, canEditOtp, isEditingOtp, editOtpErrorMessage, enableOtp, disableOtp } = useAccountOtp(
  () => user
)

function toggleOtp() {
  return isOtpEnabled.value ? disableOtp() : enableOtp()
}
</script>
