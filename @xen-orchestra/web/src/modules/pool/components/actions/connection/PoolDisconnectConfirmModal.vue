<template>
  <VtsModal accent="info" icon="status:info-picto">
    <template #title>
      <I18nT keypath="pool-disconnect-confirm-title" tag="span">
        <template #name>
          <span class="highlight">{{ serverLabel }}</span>
        </template>
      </I18nT>
    </template>

    <template #content>
      {{ t('pool-disconnect-confirm-info') }}
    </template>

    <template #buttons>
      <VtsModalCancelButton>{{ t('action:go-back') }}</VtsModalCancelButton>
      <VtsModalConfirmButton>
        {{ t('action:disconnect-pool') }}
      </VtsModalConfirmButton>
    </template>
  </VtsModal>
</template>

<script lang="ts" setup>
import VtsModal from '@core/components/modal/VtsModal.vue'
import VtsModalCancelButton from '@core/components/modal/VtsModalCancelButton.vue'
import VtsModalConfirmButton from '@core/components/modal/VtsModalConfirmButton.vue'
import { I18nT, useI18n } from 'vue-i18n'

const { serverLabel } = defineProps<{ serverLabel?: string }>()

const { t } = useI18n()
</script>
