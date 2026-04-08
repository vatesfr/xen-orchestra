<template>
  <div class="vts-clipboard-console">
    <UiCardTitle>{{ t('console-clipboard') }}</UiCardTitle>
    <UiTextarea v-model="modelValue" accent="brand" />
    <div v-if="!hasGuestTools && slots['guest-tools-warning']" class="no-guest-tools">
      <slot name="guest-tools-warning" />
    </div>
    <div class="buttons-container">
      <UiButton accent="brand" variant="primary" size="medium" @click="onSend()">
        {{ t('action:send') }}
      </UiButton>
      <UiButton
        v-tooltip="receiveTooltip"
        accent="brand"
        variant="secondary"
        size="medium"
        :disabled="!hasGuestTools"
        @click="onReceive()"
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
import { vTooltip } from '@core/directives/tooltip.directive'
import { useClipboard } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { clipboardText, hasGuestTools = true } = defineProps<{
  clipboardText: string
  hasGuestTools?: boolean
}>()

const emit = defineEmits<{ send: [text: string] }>()

const slots = defineSlots<{ 'guest-tools-warning'?(): any }>()

const { t } = useI18n()

const modelValue = ref('')

watch(
  () => clipboardText,
  text => {
    modelValue.value = text
  }
)

const { isSupported } = useClipboard({ read: true, legacy: true })

const receiveTooltip = computed(() => {
  if (!isSupported.value) {
    return t('copy-unavailable-http')
  }
  if (!hasGuestTools) {
    return t('no-xen-tools-detected')
  }

  return undefined
})

const onSend = () => emit('send', modelValue.value)

const onReceive = () => {
  modelValue.value = clipboardText
}
</script>

<style lang="postcss" scoped>
.vts-clipboard-console {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  width: 100%;

  .no-guest-tools {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }

  .buttons-container {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }
}
</style>
