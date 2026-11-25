<template>
  <UiModal accent="info" icon="status:info-picto" @dismiss="emit('cancel')">
    <template #title>
      {{ t('modal:discard-unsaved-changes?') }}
    </template>

    <template #content>
      {{ t('modal:discard-unsaved-changes-message') }}
    </template>

    <template #buttons>
      <VtsOverlayButton ref="keepEditingButton" variant="secondary" @click="emit('cancel')">
        {{ t('action:keep-editing') }}
      </VtsOverlayButton>
      <VtsOverlayButton variant="primary" @click="emit('confirm')">{{ t('action:discard') }}</VtsOverlayButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import VtsOverlayButton from '@core/components/overlay/VtsOverlayButton.vue'
import UiModal from '@core/components/ui/modal/UiModal.vue'
import { onMounted, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const { t } = useI18n()

const keepEditingButton = useTemplateRef('keepEditingButton')

onMounted(() => {
  keepEditingButton.value?.$el.focus()
})
</script>
