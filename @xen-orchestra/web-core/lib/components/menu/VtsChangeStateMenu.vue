<template>
  <MenuList :placement>
    <template #trigger="{ open }">
      <UiButton
        v-if="isInPanel"
        variant="tertiary"
        accent="brand"
        size="medium"
        left-icon="action:change-state"
        @click="open($event)"
      >
        {{ t('action:change-state') }}
      </UiButton>
      <UiDropdownButton v-else variant="secondary" size="medium" icon="action:change-state" @click="open($event)">
        {{ t('action:change-state') }}
      </UiDropdownButton>
    </template>
    <slot />
  </MenuList>
</template>

<script lang="ts" setup>
import MenuList from '@core/components/menu/MenuList.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiDropdownButton from '@core/components/ui/dropdown-button/UiDropdownButton.vue'
import { IK_PANEL_ACTIONS } from '@core/utils/injection-keys.util.ts'
import type { Options } from 'placement.js'
import { inject } from 'vue'
import { useI18n } from 'vue-i18n'

const { placement = 'bottom-end' } = defineProps<{
  placement?: Options['placement']
}>()

defineSlots<{
  default(): any
}>()

const { t } = useI18n()

const isInPanel = inject(IK_PANEL_ACTIONS, undefined) !== undefined
</script>
