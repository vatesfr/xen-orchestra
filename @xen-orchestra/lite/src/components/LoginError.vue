<template>
  <div v-if="error !== undefined" class="error typo-body-regular-small">
    <UiIcon :icon="faExclamationCircle" />
    <span v-if="error.message === 'SESSION_AUTHENTICATION_FAILED'">
      {{ $t('password-invalid') }}
    </span>
    <span v-else>
      {{ $t('error-occurred') }}
    </span>
  </div>
</template>

<script lang="ts" setup>
import UiIcon from '@/components/ui/icon/UiIcon.vue'
import type { XenApiError } from '@/libs/xen-api/xen-api.types'
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons'

defineProps<{
  error: XenApiError | undefined
}>()
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
