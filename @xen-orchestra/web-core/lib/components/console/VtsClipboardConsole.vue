<template>
  <div class="vts-clipboard-console">
    <UiCardTitle>{{ t('console-clipboard') }}</UiCardTitle>
    <UiTextarea accent="brand" :model-value="modelValue" @update:model-value="modelValue = $event" />
    <UiInfo v-if="!hasGuestTools" accent="warning">
      {{ t('no-xen-tools-detected') }}
    </UiInfo>
    <div class="buttons-container">
      <UiButton accent="brand" variant="primary" size="medium" @click="onSend">
        {{ t('action:send') }}
      </UiButton>
      <UiButton
        v-tooltip="!isSupported ? t('copy-unavailable-http') : undefined"
        accent="brand"
        variant="secondary"
        size="medium"
        :disabled="!hasGuestTools"
        @click="onReceive"
      >
        {{ t('receive') }}
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiTextarea from '@core/components/ui/text-area/UiTextarea.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { useClipboard } from '@vueuse/core'
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  clipboardText: string
  sendClipboard: (text: string) => void
  hasGuestTools?: boolean | undefined
}>()

const { t } = useI18n()

const modelValue = ref('')

watch(
  () => props.clipboardText,
  text => {
    modelValue.value = text
  }
)

const { text, isSupported } = useClipboard({ read: true, legacy: true })

const onSend = () => props.sendClipboard(modelValue.value)

const onReceive = () => {
  modelValue.value = text.value
}
</script>

<style lang="postcss" scoped>
.vts-clipboard-console {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  width: 100%;

  .buttons-container {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }
}
</style>
