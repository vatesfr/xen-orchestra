<template>
  <UiTableActions :title="t('table-actions')">
    <template v-for="(action, index) of resolvedActions" :key="index">
      <VtsResponsiveMenu v-if="action.children" :title="action.label" placement="bottom-start">
        <template #trigger="{ open }">
          <UiButton
            v-tooltip="action.hint"
            variant="tertiary"
            :accent="action.buttonAccent"
            size="medium"
            :left-icon="action.icon"
            :disabled="action.disabled"
            :busy="action.busy"
            @click="open($event)"
          >
            {{ action.label }}
          </UiButton>
        </template>
        <MenuItem
          v-for="(child, childIndex) of action.children"
          :key="childIndex"
          :icon="child.icon"
          :disabled="child.disabled"
          :busy="child.busy"
          :accent="child.accent ?? 'neutral'"
          :on-click="child.onClick"
        >
          {{ child.label }}
          <i v-if="child.hint" class="em-dash-prefix">{{ child.hint }}</i>
        </MenuItem>
      </VtsResponsiveMenu>
      <UiButton
        v-else
        v-tooltip="action.hint"
        variant="tertiary"
        :accent="action.buttonAccent"
        size="medium"
        :left-icon="action.icon"
        :disabled="action.disabled"
        :busy="action.busy"
        @click="action.onClick()"
      >
        {{ action.label }}
      </UiButton>
    </template>
  </UiTableActions>
</template>

<script setup lang="ts">
import MenuItem from '@core/components/menu/MenuItem.vue'
import type { ActionItem } from '@core/components/menu/VtsActionsMenu.vue'
import VtsResponsiveMenu from '@core/components/menu/VtsResponsiveMenu.vue'
import UiButton, { type ButtonAccent } from '@core/components/ui/button/UiButton.vue'
import UiTableActions from '@core/components/ui/table-actions/UiTableActions.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { actions = [] } = defineProps<{
  actions?: ActionItem[]
}>()

const { t } = useI18n()

const resolvedActions = computed(() =>
  actions.map(action => {
    const buttonAccent: ButtonAccent =
      action.accent === 'danger' || action.accent === 'warning' ? action.accent : 'brand'

    return { ...action, buttonAccent }
  })
)
</script>
