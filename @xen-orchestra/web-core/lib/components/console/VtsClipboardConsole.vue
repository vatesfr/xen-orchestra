<template>
  <div class="vts-clipboard-console">
    <VtsInputWrapper :label="t('console-keyboard-layout')">
      <VtsSelect :id="keyboardLayoutSelectId" accent="brand" />
    </VtsInputWrapper>
    <UiCardTitle>{{ t('console-clipboard') }}</UiCardTitle>
    <UiTextarea v-model="clipboardText" accent="brand" />
    <div class="buttons-container">
      <UiButton
        accent="brand"
        variant="primary"
        size="medium"
        :busy="isTyping"
        :disabled="!isConsoleConnected || clipboardText.length === 0"
        @click="typeTextToConsole()"
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
    <UiInfo v-if="skippedChars.length > 0" accent="warning" wrap>
      {{ t('console-type-text-skipped', { chars: skippedChars.join(' ') }) }}
    </UiInfo>
  </div>
</template>

<script setup lang="ts">
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiTextarea from '@core/components/ui/text-area/UiTextarea.vue'
import { useCopyToClipboard } from '@core/composables/copy.composable.ts'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useFormSelect } from '@core/packages/form-select'
import type { KeyboardLayoutId } from '@core/utils/keyboard-layout/keyboard-layout.types.ts'
import { guessKeyboardLayoutId, KEYBOARD_LAYOUTS } from '@core/utils/keyboard-layout/keyboard-layout.util.ts'
import { useLocalStorage } from '@vueuse/core'
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { isConsoleConnected = false, sendToConsole } = defineProps<{
  isConsoleConnected?: boolean
  sendToConsole?: (layoutId: KeyboardLayoutId) => Promise<string[]> | undefined
}>()

const clipboardText = defineModel<string>({ default: '' })

const { t } = useI18n()

const { copy, copied, isSupported } = useCopyToClipboard(() => clipboardText.value)

const keyboardLayoutId = useLocalStorage<KeyboardLayoutId>(
  'console.keyboard-layout',
  guessKeyboardLayoutId(navigator.language)
)

const { id: keyboardLayoutSelectId } = useFormSelect(KEYBOARD_LAYOUTS, {
  model: keyboardLayoutId,
  option: {
    value: 'id',
  },
})

const isTyping = ref(false)
const skippedChars = ref<string[]>([])

watch(clipboardText, () => {
  skippedChars.value = []
})

async function typeTextToConsole() {
  isTyping.value = true

  try {
    skippedChars.value = (await sendToConsole?.(keyboardLayoutId.value)) ?? []
  } finally {
    isTyping.value = false
  }
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
    gap: 0.8rem;
  }
}
</style>
