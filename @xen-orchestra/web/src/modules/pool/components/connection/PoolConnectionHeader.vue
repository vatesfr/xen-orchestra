<template>
  <UiHeadBar icon="fa:link">
    {{ t('action:connect-pool') }}
  </UiHeadBar>
</template>

<script setup lang="ts">
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
