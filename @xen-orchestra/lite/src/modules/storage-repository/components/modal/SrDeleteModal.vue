<template>
  <VtsDeleteModal dismissible>
    <template #title>
      {{ t('n-srs', { n: count }) }}
    </template>

    <template #content>
      {{ t('sr-delete-info', { n: count }) }}
      <!-- TODO Add a type-to-confirm input if count > 1 -->
    </template>

    <template #confirm>
      {{ t(`action:delete-n-srs`, { n: count }) }}
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
