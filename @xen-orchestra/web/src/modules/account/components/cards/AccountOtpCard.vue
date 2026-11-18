<template>
  <UiCard>
    <UiTitle>
      {{ t('otp-authentication') }}
      <template #action>
        <AccountOtpToggleButton :user />
      </template>
    </UiTitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('status')" :value="isOtpEnabled ? t('enabled') : t('disabled')" />
    </VtsTabularKeyValueList>
  </UiCard>
</template>

<script setup lang="ts">
import AccountOtpToggleButton from '@/modules/account/components/actions/otp/AccountOtpToggleButton.vue'
import { isXoUserOtpEnabled } from '@/modules/user/utils/xo-user.util.ts'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import type { XoUser } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { user } = defineProps<{
  user: XoUser
}>()

const { t } = useI18n()

const isOtpEnabled = computed(() => isXoUserOtpEnabled(user))
</script>
