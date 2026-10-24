<template>
  <UiTag v-tooltip="t('firewall:tech-preview:info')" accent="info" variant="secondary">
    {{ t('firewall:tech-preview') }}
  </UiTag>
</template>

<script lang="ts" setup>
import UiTag from '@core/components/ui/tag/UiTag.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
