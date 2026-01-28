<!-- TODO Need to be change to be able to customize the text etc -->
<template>
  <VtsModal accent="danger" icon="status:danger-picto">
    <template #title>
      <span>{{ t('deletion-blocked') }}</span>
    </template>
    <template #content>
      {{ t('vm-protected-deletion') }}
    </template>
    <template #buttons>
      <VtsModalCancelButton>{{ t('action:go-back') }}</VtsModalCancelButton>
      <UiLink :href icon="action:edit" size="medium" @click="emit('confirm')">
        {{ t('action:edit-config') }}
      </UiLink>
    </template>
  </VtsModal>
</template>

<script lang="ts" setup>
import VtsModal from '@core/components/modal/VtsModal.vue'
import VtsModalCancelButton from '@core/components/modal/VtsModalCancelButton.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  href?: string
}>()

const emit = defineEmits<{
  confirm: []
}>()

const { t } = useI18n()
</script>
