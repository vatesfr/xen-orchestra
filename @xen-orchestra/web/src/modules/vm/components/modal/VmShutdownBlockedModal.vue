<template>
  <VtsBlockedModal>
    <template #title>
      {{ t('shutdown-blocked') }}
    </template>

    <template #content>
      {{ t('vm-protected-shutdown') }}
    </template>

    <template #confirm-button>
      {{ t('action:force-shutdown') }}
    </template>
  </VtsBlockedModal>
</template>

<script setup lang="ts">
import VtsBlockedModal from '@core/components/modal/VtsBlockedModal.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
