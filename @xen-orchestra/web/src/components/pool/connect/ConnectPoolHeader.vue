<template>
  <UiHeadBar :icon="faLink">
    {{ t('connect-pool') }}
  </UiHeadBar>
</template>

<script setup lang="ts">
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import { faLink } from '@fortawesome/free-solid-svg-icons'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
