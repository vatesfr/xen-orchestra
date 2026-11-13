<template>
  <MenuList :placement>
    <template #trigger="{ open }">
      <UiDropdownButton variant="secondary" size="medium" icon="action:change-state" @click="open($event)">
        {{ t('action:change-state') }}
      </UiDropdownButton>
    </template>
    <slot />
  </MenuList>
</template>

<script lang="ts" setup>
import MenuList from '@core/components/menu/MenuList.vue'
import UiDropdownButton from '@core/components/ui/dropdown-button/UiDropdownButton.vue'
import type { Options } from 'placement.js'
import { useI18n } from 'vue-i18n'

const { placement = 'bottom-end' } = defineProps<{
  placement?: Options['placement']
}>()

defineSlots<{
  default(): any
}>()

const { t } = useI18n()
</script>
