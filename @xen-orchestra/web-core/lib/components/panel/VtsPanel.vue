<!-- v5 -->
<template>
  <UiPanel :error>
    <template v-if="needsHeader" #header>
      <slot v-if="slots.header" name="header" />
      <div
        v-if="slots.actions || slots['more-actions']"
        ref="action-buttons"
        :class="{ 'menu-only': isMenuAlone }"
        class="action-buttons"
      >
        <PanelActions :inline-count="inlineActionsCount" @change="count => updateActionsCount(count)">
          <slot name="actions" />
          <VtsActionsMenu
            v-if="slots['more-actions'] || collapsedActionsCount > 0"
            :label="t('more-actions')"
            size="medium"
          >
            <PanelCollapsedActions v-if="collapsedActionsCount > 0" />
            <slot name="more-actions" />
          </VtsActionsMenu>
        </PanelActions>
      </div>
      <div v-if="slots['corner-actions'] || closable" class="corner-actions">
        <slot v-if="slots['corner-actions']" name="corner-actions" />
        <UiButtonIcon
          v-if="closable"
          v-tooltip="t('action:close')"
          size="small"
          variant="tertiary"
          accent="brand"
          :icon="closeIcon"
          @click="emit('close')"
        />
      </div>
    </template>
    <slot />
  </UiPanel>
</template>

<script setup lang="ts">
import VtsActionsMenu from '@core/components/menu/VtsActionsMenu.vue'
import PanelActions from '@core/components/panel/PanelActions.vue'
import PanelCollapsedActions from '@core/components/panel/PanelCollapsedActions.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { useCollapseOnOverflow } from '@core/composables/collapse-on-overflow.composable.ts'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import type { IconName } from '@core/icons'
import { IK_PANEL_ACTIONS_COMPACT } from '@core/utils/injection-keys.util.ts'
import { computed, provide, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

const { closable, closeIcon = 'action:close-cancel-clear' } = defineProps<{
  error?: boolean
  closable?: boolean
  closeIcon?: IconName
}>()

const emit = defineEmits<{
  close: []
}>()

const slots = defineSlots<{
  default(): any
  header?(): any
  actions?(): any
  'more-actions'?(): any
  'corner-actions'?(): any
}>()

const { t } = useI18n()

const needsHeader = computed(
  () => slots.header || slots.actions || slots['more-actions'] || slots['corner-actions'] || closable
)

const actionButtons = useTemplateRef('action-buttons')

const header = computed(() => actionButtons.value?.parentElement)

const actionsCount = ref(0)

const { collapsedCount, reset: resetCollapsedCount } = useCollapseOnOverflow(header, actionButtons, () =>
  Math.max(actionsCount.value, 1)
)

const collapsedActionsCount = computed(() => Math.min(collapsedCount.value, actionsCount.value))

const inlineActionsCount = computed(() => actionsCount.value - collapsedActionsCount.value)

const areActionsCompact = computed(() => collapsedCount.value > 0)

const isMenuAlone = computed(() => areActionsCompact.value && inlineActionsCount.value === 0)

provide(IK_PANEL_ACTIONS_COMPACT, areActionsCompact)

function updateActionsCount(count: number) {
  actionsCount.value = count
  resetCollapsedCount()
}
</script>

<style scoped lang="postcss">
.action-buttons {
  display: flex;
  align-items: center;
  gap: 1.6rem;
  white-space: nowrap;

  &.menu-only {
    margin-inline-start: auto;

    + .corner-actions {
      margin-inline-start: 0;
    }
  }
}
.corner-actions {
  display: flex;
  align-items: center;
  margin-inline-start: auto;
  gap: 0.8rem;
}
</style>
