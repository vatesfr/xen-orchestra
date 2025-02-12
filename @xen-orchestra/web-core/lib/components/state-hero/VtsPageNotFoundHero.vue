<template>
  <VtsStateHero class="vts-page-not-found-hero" image="not-found" :type>
    <span class="numeric">404</span><br />
    {{ $t('page-not-found') }}
  </VtsStateHero>
</template>

<script lang="ts" setup>
import VtsStateHero, { type StateHeroType } from '@core/components/state-hero/VtsStateHero.vue'

defineProps<{
  type: StateHeroType
}>()
</script>

<style lang="postcss" scoped>
.vts-page-not-found-hero {
  text-align: center;
  margin-top: 4rem;

  .numeric {
    color: var(--color-brand-txt-base);
    font-size: 9.6rem;
    font-weight: 900;
    letter-spacing: 1em;
    line-height: 100%;
    margin-right: -1em;
  }
}
</style>
