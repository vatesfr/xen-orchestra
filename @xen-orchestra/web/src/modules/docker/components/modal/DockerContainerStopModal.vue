<template>
  <UiModal accent="warning" icon="status:warning-picto" @confirm="emit('confirm')" @dismiss="emit('cancel')">
    <template #title>
      {{ t('modal:confirm-docker-container-stop?', { name }) }}
    </template>

    <template #content>
      {{
        policy === 'unless-stopped'
          ? t('warning:docker-restart-policy-unless-stopped')
          : t('warning:docker-restart-policy-always', { policy })
      }}
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')">{{ t('action:go-back') }}</VtsOverlayCancelButton>
      <VtsOverlayConfirmButton>{{ t('action:stop') }}</VtsOverlayConfirmButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import type { DockerStopConfirmedRestartPolicy } from '@/modules/docker/types/docker.type.ts'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiModal from '@core/components/ui/modal/UiModal.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  name: string
  policy: DockerStopConfirmedRestartPolicy
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const { t } = useI18n()
</script>
