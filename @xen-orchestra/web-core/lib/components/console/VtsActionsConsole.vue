<template>
  <UiCardTitle>{{ t('console-actions') }}</UiCardTitle>
  <UiButton
    class="button"
    accent="brand"
    variant="tertiary"
    size="medium"
    :left-icon="isFullscreen ? 'fa:down-left-and-up-right-to-center' : 'fa:up-right-and-down-left-from-center'"
    @click="toggleFullScreen"
  >
    {{ t(isFullscreen ? 'exit-fullscreen' : 'fullscreen') }}
  </UiButton>
  <UiButton
    class="button"
    accent="brand"
    variant="tertiary"
    size="medium"
    left-icon="fa:arrow-up-right-from-square"
    @click="openInNewTab"
  >
    {{ t('open-console-in-new-tab') }}
  </UiButton>
  <UiButton
    class="button"
    accent="brand"
    variant="tertiary"
    size="medium"
    left-icon="fa:keyboard"
    @click="sendCtrlAltDel"
  >
    {{ t('send-ctrl-alt-del') }}
  </UiButton>
</template>

<script lang="ts" setup>
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { useUiStore } from '@core/stores/ui.store'
import { useActiveElement, useMagicKeys, whenever } from '@vueuse/core'
import { logicAnd } from '@vueuse/math'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

defineProps<{
  sendCtrlAltDel: () => void
}>()

const { t } = useI18n()

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
