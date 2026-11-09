<!-- v5 -->
<template>
  <UiPanel :error>
    <template v-if="needsHeader" #header>
      <slot v-if="slots.header" name="header" />
      <div v-if="slots.actions || slots['more-actions']" class="action-buttons">
        <template v-if="slots.actions">
          <slot name="actions" />
        </template>
        <VtsActionsMenu v-if="slots['more-actions']" :label="t('more-actions')" size="medium">
          <slot name="more-actions" />
        </VtsActionsMenu>
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
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import type { IconName } from '@core/icons'
import { computed } from 'vue'
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
</script>

<style scoped lang="postcss">
.action-buttons {
  display: flex;
  align-items: center;
  gap: 1.6rem;
}
.corner-actions {
  display: flex;
  align-items: center;
  margin-inline-start: auto;
  gap: 0.8rem;
}
</style>
