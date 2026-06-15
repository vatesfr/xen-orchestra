<!-- v5 -->
<template>
  <div class="vts-side-panel-sticky" :class="{ mobile: uiStore.isSmall }">
    <VtsPanel
      :error
      :closable
      :close-icon="uiStore.isSmall ? 'fa:angle-left' : 'action:close-cancel-clear'"
      class="vts-side-panel"
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

      <slot />
    </VtsPanel>
  </div>
</template>

<script setup lang="ts">
import VtsPanel from '@core/components/panel/VtsPanel.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { usePanelStore } from '@core/stores/panel.store'
import { useUiStore } from '@core/stores/ui.store'
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  closable?: boolean
  error?: boolean
  selected?: boolean
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

watch(
  [() => props.selected, () => panelStore.isLocked, () => uiStore.isSmall],
  ([selected, isLocked, isSmall], previousState) => {
    const [, previousIsLocked] = previousState ?? []

    /* Collapse when coming back from locked to unlocked, if empty */
    if (!isSmall && previousIsLocked && !isLocked && !selected) {
      panelStore.collapse()
    }

    if (selected === undefined) {
      return
    }

    panelStore.syncWithSelection(selected)
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
  width: var(--side-panel-width, 40rem);
  transition: transform 0.25s;

  &:not(.mobile) {
    --panel-viewport-height: calc(100dvh - 5.6rem);
    --panel-min-height: calc(100dvh - 16.6rem);

    min-height: var(--panel-min-height);
    max-height: var(--panel-viewport-height);
    overflow: hidden;
    transform: translateX(v-bind('panelStore.cssHorizontalOffset'));

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
    transform: translateX(v-bind('panelStore.cssHorizontalOffset'));

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
