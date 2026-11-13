<template>
  <MenuItem accent="brand" icon="action:change-state">
    {{ t('action:change-state') }}
    <template #submenu>
      <slot />
    </template>
  </MenuItem>
</template>

<script lang="ts" setup>
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useI18n } from 'vue-i18n'

defineSlots<{
  default(): any
}>()

const { t } = useI18n()
</script>
