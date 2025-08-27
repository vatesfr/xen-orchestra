<template>
  <div class="page-not-found">
    <VtsStateHero format="page" type="not-found" image-size="large">
      {{ t('page-not-found') }}
    </VtsStateHero>
    <UiLink to="/" size="medium">
      {{ t('back-site-dashboard') }}
    </UiLink>
  </div>
</template>

<script setup lang="ts">
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
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
