<template>
  <UiButton
    v-tooltip="!canForgetHost && forgetHostErrorMessage"
    size="medium"
    variant="tertiary"
    accent="danger"
    :disabled="!canForgetHost"
    left-icon="action:forget"
    :busy="isForgettingHost"
    @click="openForgetModal()"
  >
    {{ t('action:forget-host') }}
  </UiButton>
</template>

<script lang="ts" setup>
import { useHostForgetModal } from '@/modules/host/composables/use-host-forget-modal.composable.ts'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: FrontXoHost
}>()

const { t } = useI18n()

const {
  openModal: openForgetModal,
  canRun: canForgetHost,
  isRunning: isForgettingHost,
  errorMessage: forgetHostErrorMessage,
} = useHostForgetModal(() => host)
</script>
