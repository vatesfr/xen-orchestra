<template>
  <MenuList placement="bottom-end">
    <template #trigger="{ open }">
      <UiButtonIcon
        v-tooltip="{
          placement: 'left',
          content: t('action:copy-all'),
        }"
        icon="action:more-actions"
        accent="brand"
        size="medium"
        :disabled="!isSupported"
        @click="open($event)"
      />
    </template>
    <MenuItem icon="action:copy" @click="copy()">
      {{ t('action:copy-all') }}
    </MenuItem>
  </MenuList>
</template>

<script setup lang="ts">
import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useClipboard } from '@vueuse/core'
import { useI18n } from 'vue-i18n'

const { values } = defineProps<{
  values: string[]
}>()

const { t } = useI18n()

const { copy, isSupported } = useClipboard({ source: () => values.join('\n'), legacy: true })
</script>
