<template>
  <VtsResponsiveMenu :title="t('action:copy-all')" placement="bottom-end">
    <template #trigger="{ open }">
      <UiButtonIcon
        v-tooltip="{
          placement: 'left',
          content: tooltipContent,
        }"
        :icon
        accent="brand"
        size="small"
        :disabled="!isSupported"
        @click="open($event)"
      />
    </template>
    <MenuItem accent="neutral" icon="action:copy" @click="copy()">
      {{ t('action:copy-all') }}
    </MenuItem>
  </VtsResponsiveMenu>
</template>

<script lang="ts" setup>
import MenuItem from '@core/components/menu/MenuItem.vue'
import VtsResponsiveMenu from '@core/components/menu/VtsResponsiveMenu.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { useCopyToClipboard } from '@core/composables/copy.composable.ts'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { values } = defineProps<{
  values: string[]
}>()

const { t } = useI18n()

const { copy, copied, isSupported } = useCopyToClipboard(() => values.join(';\n'))

const icon = computed(() => (copied.value ? 'fa:check-circle' : 'action:more-actions'))

const tooltipContent = computed(() => {
  if (!isSupported.value) {
    return t('copy-unavailable-http')
  }

  return copied.value ? t('copied') : t('action:copy-all')
})
</script>
