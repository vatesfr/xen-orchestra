<!-- TODO Need to be change to be able to customize the text etc -->
<template>
  <VtsModal accent="danger" icon="fa:meteor">
    <template #title>
      <span>{{ t('deletion-blocked') }}</span>
    </template>
    <template #content>
      {{ t('vm-protected-deletion') }}
    </template>
    <template #buttons>
      <VtsModalCancelButton>{{ t('action:go-back') }}</VtsModalCancelButton>
      <VtsModalConfirmButton>
        <VtsIcon size="small" name="fa:edit" />
        {{ t(`action:edit-config`) }}
      </VtsModalConfirmButton>
    </template>
  </VtsModal>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsModal from '@core/components/modal/VtsModal.vue'
import VtsModalCancelButton from '@core/components/modal/VtsModalCancelButton.vue'
import VtsModalConfirmButton from '@core/components/modal/VtsModalConfirmButton.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
