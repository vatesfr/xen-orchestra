<!-- v5 -->
<template>
  <div class="vts-side-panel-sticky" :class="{ mobile: uiStore.isSmall }">
    <VtsResizeHandle v-if="showResizeHandle" position="start" :resizable="panelStore" />
    <VtsPanel
      :closable="hasSelection"
      :close-icon="uiStore.isSmall ? 'fa:angle-left' : 'action:close-cancel-clear'"
      class="vts-side-panel"
      :style="{ transform }"
      :class="{
        locked: panelStore.isLocked && !uiStore.isSmall,
        mobile: uiStore.isSmall,
      }"
      @close="handleClose"
    >
      <template v-if="slots.actions" #actions>
        <slot name="actions" />
      </template>

      <template v-if="slots['more-actions']" #more-actions>
        <slot name="more-actions" />
      </template>

      <template v-if="slots['corner-actions'] || !uiStore.isSmall" #corner-actions>
        <slot v-if="slots['corner-actions']" name="corner-actions" />
        <UiButtonIcon
          v-if="!uiStore.isSmall"
          v-tooltip="{
            content: panelStore.isLocked ? t('action:sidebar-unlock') : t('action:sidebar-lock'),
            placement: 'left',
          }"
          accent="brand"
          size="small"
          :icon="panelStore.isLocked ? 'action:pin-panel-hide' : 'action:pin-panel'"
          @click="panelStore.toggleLock()"
        />
      </template>

      <VtsStateHero v-if="!hasSelection" format="panel" type="no-selection" size="medium" />
      <slot v-else />
    </VtsPanel>
  </div>
</template>

<script setup lang="ts">
import VtsPanel from '@core/components/panel/VtsPanel.vue'
import VtsResizeHandle from '@core/components/resize-handle/VtsResizeHandle.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { PANEL_TRANSITION_DURATION, usePanelStore } from '@core/stores/panel.store.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import { IK_INFO_SIZE, IK_MENU_ACTION_HANDLER } from '@core/utils/injection-keys.util.ts'
import { computed, provide, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { hasSelection } = defineProps<{
  hasSelection?: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const slots = defineSlots<{
  default(): any
  actions?(): any
  'more-actions'?(): any
  'corner-actions'?(): any
}>()

const panelStore = usePanelStore()
const uiStore = useUiStore()

const { t } = useI18n()

const showResizeHandle = computed(() => !uiStore.isSmall && panelStore.isExpanded)

const transform = computed(() => `translateX(${panelStore.cssHorizontalOffset})`)

const transformTransition = `transform ${PANEL_TRANSITION_DURATION}ms`

provide(IK_INFO_SIZE, 'small')

provide(IK_MENU_ACTION_HANDLER, () => {
  if (uiStore.isSmall) {
    handleClose()
  }
})

watch(
  [() => hasSelection, () => panelStore.isLocked, () => uiStore.isSmall],
  ([hasSelection]) => {
    if (hasSelection === undefined) {
      return
    }

    panelStore.syncWithSelection(hasSelection)
  },
  { immediate: true }
)

function handleClose() {
  if (panelStore.syncsOpenStateWithSelection) {
    panelStore.collapse()
  }

  emit('close')
}
</script>

<style scoped lang="postcss">
.vts-side-panel-sticky:not(.mobile) {
  position: sticky;
  top: 0;
  align-self: start;
}

.vts-side-panel {
  width: v-bind('panelStore.cssWidth');
  transition: v-bind(transformTransition);

  &:not(.mobile) {
    --panel-viewport-height: calc(100dvh - 5.6rem);
    --panel-min-height: calc(100dvh - 16.6rem);

    min-height: var(--panel-min-height);
    max-height: var(--panel-viewport-height);
    overflow: hidden;

    :deep(> .content) {
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
    }
  }

  &.mobile {
    z-index: 1010;
    position: fixed;
    width: 100dvw;
    height: 100dvh;
    inset: 0;

    :deep(.corner-actions) {
      margin-inline-start: 0;
      margin-inline-end: auto;
      order: -1;
    }

    :deep(> .content) {
      overflow: auto;
    }
  }
}
</style>
