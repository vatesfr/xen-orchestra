<template>
  <VtsDeleteModal>
    <template #title>
      {{ t('n-vdis', { n: count }) }}
    </template>

    <template #content>
      {{ t('vdi-delete-warning') }}
    </template>

    <template #confirm>
      {{ t(`action:delete-vdis`, { n: count }) }}
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
