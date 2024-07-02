<template>
  <StateHero busy class="loading-hero">
    {{ $t('loading-in-progress') }}
  </StateHero>
</template>

<script lang="ts" setup>
import StateHero from '@core/components/state-hero/StateHero.vue'
</script>
