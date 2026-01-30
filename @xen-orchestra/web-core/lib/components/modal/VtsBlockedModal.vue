<!-- TODO Need to be change to be able to customize the text etc -->
<template>
  <VtsModal accent="danger" icon="status:danger-picto">
    <template #title>
      <slot name="title" />
    </template>

    <template #content>
      <slot name="content" />
    </template>

    <template #buttons>
      <VtsModalCancelButton>{{ t('action:go-back') }}</VtsModalCancelButton>
      <template v-if="slots['confirm-link']">
        <slot name="confirm-link" />
      </template>

      <VtsModalConfirmButton v-if="slots['confirm-button']">
        <slot name="confirm-button" />
      </VtsModalConfirmButton>
    </template>
  </VtsModal>
</template>

<script lang="ts" setup>
import VtsModal from '@core/components/modal/VtsModal.vue'
import VtsModalCancelButton from '@core/components/modal/VtsModalCancelButton.vue'
import VtsModalConfirmButton from '@core/components/modal/VtsModalConfirmButton.vue'
import { useI18n } from 'vue-i18n'

const slots = defineSlots<{
  title(): any
  content(): any
  'confirm-link'?(): any
  'confirm-button'?(): any
}>()

const { t } = useI18n()
</script>
