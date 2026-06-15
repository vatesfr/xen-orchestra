<template>
  <VtsModal accent="info" icon="status:info-picto" dismissible>
    <template #title>
      {{ t('sr-disconnect-title', { n: count }) }}
    </template>

    <template #content>
      {{ disconnectInfo }}
    </template>

    <template #buttons>
      <VtsModalCancelButton>{{ t('action:go-back') }}</VtsModalCancelButton>
      <VtsModalConfirmButton>
        {{ t('action:disconnect-n-srs', { n: count }) }}
      </VtsModalConfirmButton>
    </template>
  </VtsModal>
</template>

<script lang="ts" setup>
import type { StorageScope } from '@/modules/storage-repository/types/storage-scope.type.ts'
import VtsModal from '@core/components/modal/VtsModal.vue'
import VtsModalCancelButton from '@core/components/modal/VtsModalCancelButton.vue'
import VtsModalConfirmButton from '@core/components/modal/VtsModalConfirmButton.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { count, scope } = defineProps<{
  count: number
  scope: StorageScope
}>()

const { t } = useI18n()

const disconnectInfo = computed(() =>
  scope.type === 'host' ? t('sr-disconnect-info-host') : t('sr-disconnect-info-pool')
)
</script>
