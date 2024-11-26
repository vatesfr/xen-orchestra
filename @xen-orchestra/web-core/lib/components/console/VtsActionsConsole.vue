<template>
  <UiCardTitle>{{ $t('console-actions') }}</UiCardTitle>
  <UiButton
    v-tooltip="toggleFullScreen === undefined ? $t('coming-soon') : undefined"
    class="button"
    :disabled="toggleFullScreen === undefined"
    accent="info"
    variant="tertiary"
    size="medium"
    :left-icon="isFullscreen ? faDownLeftAndUpRightToCenter : faUpRightAndDownLeftFromCenter"
    @click="toggleFullScreen"
  >
    {{ $t(isFullscreen ? 'exit-fullscreen' : 'fullscreen') }}
  </UiButton>
  <UiButton
    v-tooltip="openInNewTab === undefined ? $t('coming-soon') : undefined"
    class="button"
    :disabled="openInNewTab === undefined"
    accent="info"
    variant="tertiary"
    size="medium"
    :left-icon="faArrowUpRightFromSquare"
    @click="openInNewTab"
  >
    {{ $t('open-console-in-new-tab') }}
  </UiButton>
  <UiButton
    v-tooltip="sendCtrlAltDel === undefined ? $t('coming-soon') : undefined"
    class="button"
    accent="info"
    variant="tertiary"
    size="medium"
    :disabled="sendCtrlAltDel === undefined"
    :left-icon="faKeyboard"
    @click="sendCtrlAltDel"
  >
    {{ $t('send-ctrl-alt-del') }}
  </UiButton>
</template>

<script lang="ts" setup>
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import {
  faArrowUpRightFromSquare,
  faDownLeftAndUpRightToCenter,
  faKeyboard,
  faUpRightAndDownLeftFromCenter,
} from '@fortawesome/free-solid-svg-icons'

// temporary undefined for xo6
defineProps<{
  openInNewTab?: () => void
  toggleFullScreen?: () => void
  sendCtrlAltDel?: () => void
  isFullscreen?: boolean
}>()
</script>

<style lang="postcss" scoped>
.button {
  align-self: start;
  gap: 0.8rem;
  text-align: left;
}
</style>
