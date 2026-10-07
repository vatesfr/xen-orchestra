<template>
  <UiTableActions :title="t('table-actions')">
    <template v-for="(action, index) of actions" :key="index">
      <MenuList v-if="isGroupAction(action)" placement="bottom-start">
        <template #trigger="{ open }">
          <UiButton
            v-tooltip="action.hint"
            variant="tertiary"
            :accent="buttonAccent(action.accent)"
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
      </MenuList>
      <UiButton
        v-else
        v-tooltip="action.hint"
        variant="tertiary"
        :accent="buttonAccent(action.accent)"
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
import type { MenuItemAccent } from '@core/components/menu/MenuItem.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import type { ActionItem, GroupActionItem } from '@core/components/menu/VtsActionsMenu.vue'
import UiButton, { type ButtonAccent } from '@core/components/ui/button/UiButton.vue'
import UiTableActions from '@core/components/ui/table-actions/UiTableActions.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

const { actions = [] } = defineProps<{
  actions?: ActionItem[]
}>()

const { t } = useI18n()

function buttonAccent(accent: MenuItemAccent | undefined): ButtonAccent {
  return accent === 'danger' || accent === 'warning' ? accent : 'brand'
}

function isGroupAction(action: ActionItem): action is GroupActionItem {
  return 'children' in action
}
</script>
