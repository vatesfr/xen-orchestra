<template>
  <div v-if="error !== undefined" class="error typo-body-regular-small">
    <VtsIcon name="fa:exclamation-circle" size="medium" />
    <span v-if="error.message === 'SESSION_AUTHENTICATION_FAILED'">
      {{ t('password-invalid') }}
    </span>
    <span v-else>
      {{ t('error-occurred') }}
    </span>
  </div>
</template>

<script lang="ts" setup>
import type { XenApiError } from '@/libs/xen-api/xen-api.types'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  error: XenApiError | undefined
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.error {
  margin: 0.5rem 0;
  color: var(--color-danger-txt-base);

  & svg {
    margin-right: 0.5rem;
  }
}
</style>
