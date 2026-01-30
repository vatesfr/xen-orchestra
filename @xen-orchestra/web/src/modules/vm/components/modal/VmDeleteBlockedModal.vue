<template>
  <VtsBlockedModal>
    <template #title>
      {{ t('deletion-blocked') }}
    </template>

    <template #content>
      {{ t('vm-protected-deletion') }}
    </template>

    <template #confirm-link>
      <UiLink :href icon="action:edit" size="medium" @click="emit('confirm')">
        {{ t('action:edit-config') }}
      </UiLink>
    </template>
  </VtsBlockedModal>
</template>

<script setup lang="ts">
import VtsBlockedModal from '@core/components/modal/VtsBlockedModal.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  href?: string
}>()

const emit = defineEmits<{
  confirm: []
}>()
const { t } = useI18n()
</script>
