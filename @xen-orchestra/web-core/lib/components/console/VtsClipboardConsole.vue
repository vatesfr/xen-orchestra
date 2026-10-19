<template>
  <div class="vts-clipboard-console">
    <UiCardTitle>{{ t('console-clipboard') }}</UiCardTitle>
    <UiTextarea v-model="clipboardText" accent="brand" />
    <div class="buttons-container">
      <UiButton
        accent="brand"
        variant="primary"
        size="medium"
        :disabled="!isConsoleConnected || clipboardText.length === 0"
        @click="sendToConsole?.()"
      >
        {{ t('action:send') }}
      </UiButton>
      <UiButton
        v-tooltip="!isSupported ? t('copy-unavailable-http') : copied && t('copied')"
        accent="brand"
        variant="secondary"
        size="medium"
        :disabled="!isSupported"
        @click="copy()"
      >
        {{ t('receive') }}
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiTextarea from '@core/components/ui/text-area/UiTextarea.vue'
import { useCopyToClipboard } from '@core/composables/copy.composable.ts'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

const { isConsoleConnected = false, sendToConsole } = defineProps<{
  isConsoleConnected?: boolean
  sendToConsole?: () => void
}>()

const clipboardText = defineModel<string>({ default: '' })

const { t } = useI18n()

const { copy, copied, isSupported } = useCopyToClipboard(() => clipboardText.value)
</script>

<style lang="postcss" scoped>
.vts-clipboard-console {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  width: 100%;

  .buttons-container {
    display: flex;
    gap: 0.8rem;
  }
}
</style>
