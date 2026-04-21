<template>
  <VtsDeleteModal>
    <template #title>
      {{ t('n-vifs', { n: count }) }}
    </template>

    <template #confirm>
      {{ t(`action:delete-n-vifs`, { n: count }) }}
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
