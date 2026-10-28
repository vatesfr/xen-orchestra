<template>
  <UiButtonIcon v-tooltip="t('action:delete')" icon="action:delete" accent="danger" size="small" />
</template>

<script lang="ts" setup>
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
