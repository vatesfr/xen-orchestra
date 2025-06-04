<template>
  <UiHeadBar :icon="faLink">
    {{ $t('connect-pool') }}
  </UiHeadBar>
</template>

<script setup lang="ts">
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import { faLink } from '@fortawesome/free-solid-svg-icons'
</script>
