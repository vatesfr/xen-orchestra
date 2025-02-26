<template>
  <UiCardTitle>{{ $t('console-actions') }}</UiCardTitle>
  <UiButton
    class="button"
    accent="brand"
    variant="tertiary"
    size="medium"
    :left-icon="isFullscreen ? faDownLeftAndUpRightToCenter : faUpRightAndDownLeftFromCenter"
    @click="toggleFullScreen"
  >
    {{ $t(isFullscreen ? 'exit-fullscreen' : 'fullscreen') }}
  </UiButton>
  <UiButton
    class="button"
    accent="brand"
    variant="tertiary"
    size="medium"
    :left-icon="faArrowUpRightFromSquare"
    @click="openInNewTab"
  >
    {{ $t('open-console-in-new-tab') }}
  </UiButton>
  <UiButton
    class="button"
    accent="brand"
    variant="tertiary"
    size="medium"
    :left-icon="faKeyboard"
    @click="sendCtrlAltDel"
  >
    {{ $t('send-ctrl-alt-del') }}
  </UiButton>
</template>

<script lang="ts" setup>
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { useUiStore } from '@core/stores/ui.store'
import {
  faArrowUpRightFromSquare,
  faDownLeftAndUpRightToCenter,
  faKeyboard,
  faUpRightAndDownLeftFromCenter,
} from '@fortawesome/free-solid-svg-icons'
import { useActiveElement, useMagicKeys, whenever } from '@vueuse/core'
import { logicAnd } from '@vueuse/math'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

defineProps<{
  sendCtrlAltDel: () => void
}>()

const router = useRouter()
const uiStore = useUiStore()

const isFullscreen = computed(() => !uiStore.hasUi)

const openInNewTab = () => {
  const routeData = router.resolve({ query: { ui: '0' } })
  window.open(routeData.href, '_blank')
}

const toggleFullScreen = () => {
  uiStore.hasUi = !uiStore.hasUi
}
const { escape } = useMagicKeys()
const activeElement = useActiveElement()
const canClose = computed(
  () => (activeElement.value == null || activeElement.value.tagName !== 'CANVAS') && !uiStore.hasUi
)
whenever(logicAnd(escape, canClose), toggleFullScreen)
</script>

<style lang="postcss" scoped>
.button {
  align-self: start;
  gap: 0.8rem;
  text-align: left;
}
</style>
