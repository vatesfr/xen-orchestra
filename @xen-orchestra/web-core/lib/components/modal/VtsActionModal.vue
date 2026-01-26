<template>
  <VtsModal :accent icon="fa:user-astronaut">
    <template #title>
      <span>{{ title }}</span>
    </template>
    <template #content>
      <span>{{ message }}</span>
    </template>
    <template #buttons>
      <VtsModalCancelButton>{{ t('action:go-back') }}</VtsModalCancelButton>
      <VtsModalConfirmButton>
        {{ actionText }}
      </VtsModalConfirmButton>
    </template>
  </VtsModal>
</template>

<script lang="ts" setup>
import VtsModal from '@core/components/modal/VtsModal.vue'
import VtsModalCancelButton from '@core/components/modal/VtsModalCancelButton.vue'
import VtsModalConfirmButton from '@core/components/modal/VtsModalConfirmButton.vue'
import type { ModalAccent } from '@core/components/ui/modal/UiModal.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { action, object } = defineProps<{
  action: 'reboot' | 'shutdown' | 'force-reboot' | 'force-shutdown'
  accent: ModalAccent
  object: 'vm' // add more object if needed
}>()

const { t } = useI18n()

const title = computed(() => t(`modal:confirm-object-${action}`, { object }))

const message = computed(() => t(`modal:${object}-${action}-message`))

const actionText = computed(() => t(`modal:action:${action}`, { object }))
</script>
