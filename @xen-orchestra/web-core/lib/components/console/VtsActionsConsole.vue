<template>
  <UiCardTitle>{{ $t('console-actions') }}</UiCardTitle>
  <UiButton
    v-tooltip="openInNewTab === undefined ? $t('coming-soon') : undefined"
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
    v-tooltip="toggleFullScreen === undefined ? $t('coming-soon') : undefined"
    :disabled="toggleFullScreen === undefined"
    accent="info"
    variant="tertiary"
    size="medium"
    :left-icon="faUpRightAndDownLeftFromCenter"
    @click="toggleFullScreen"
  >
    {{ $t('fullscreen') }}
  </UiButton>
  <UiButton
    v-tooltip="sendCtrlAltDel === undefined ? $t('coming-soon') : undefined"
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
import { faArrowUpRightFromSquare, faKeyboard, faUpRightAndDownLeftFromCenter } from '@fortawesome/free-solid-svg-icons'

// temporary undefined for xo6
defineProps<{
  openInNewTab?: () => void
  toggleFullScreen?: () => void
  sendCtrlAltDel?: () => void
}>()
</script>

<style lang="postcss" scoped>
.ui-button {
  align-self: start;
  gap: 0.8rem;
  text-align: left;
}
</style>
