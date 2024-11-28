<template>
  <div class="page-not-found">
    <VtsPageNotFoundHero type="page" />
    <RouterLink class="link" to="/">
      {{ $t('back-site-dashboard') }}
    </RouterLink>
  </div>
</template>

<script setup lang="ts">
import VtsPageNotFoundHero from '@core/components/state-hero/VtsPageNotFoundHero.vue'
</script>

<style lang="postcss" scoped>
.page-not-found {
  display: flex;
  margin-bottom: 4rem;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2rem;
}
</style>
