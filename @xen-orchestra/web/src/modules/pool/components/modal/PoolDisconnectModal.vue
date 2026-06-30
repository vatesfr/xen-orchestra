<template>
  <VtsDisconnectModal>
    <template #title>
      {{ poolName }}
    </template>

    <template #confirm>
      {{ t('action:disconnect') }}
    </template>
  </VtsDisconnectModal>
</template>

<script lang="ts" setup>
import VtsDisconnectModal from '@core/components/modal/VtsDisconnectModal.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  poolName: string
}>()

const { t } = useI18n()
</script>
