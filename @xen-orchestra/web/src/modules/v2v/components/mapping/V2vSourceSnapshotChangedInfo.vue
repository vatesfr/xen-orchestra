<template>
  <UiInfo accent="warning" wrap>{{ t('v2v:source-snapshot-changed-info') }}</UiInfo>
</template>

<script lang="ts" setup>
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
