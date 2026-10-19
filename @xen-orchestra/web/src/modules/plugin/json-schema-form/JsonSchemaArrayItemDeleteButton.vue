<template>
  <UiButtonIcon v-tooltip="t('action:delete')" icon="fa:trash" accent="danger" size="small" :disabled />
</template>

<script lang="ts" setup>
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

defineProps<{
  disabled?: boolean
}>()

const { t } = useI18n()
</script>
