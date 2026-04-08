<template>
  <VtsDeleteModal>
    <template #title>
      {{ t('n-networks', { n: count }) }}
    </template>

    <template #confirm>
      {{ t(`action:delete-networks`, { n: count }) }}
    </template>
  </VtsDeleteModal>
</template>

<script lang="ts" setup>
import VtsDeleteModal from '@core/components/modal/VtsDeleteModal.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  count: number
}>()

const { t } = useI18n()
</script>
