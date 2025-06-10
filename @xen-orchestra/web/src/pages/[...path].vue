<template>
  <div class="page-not-found">
    <VtsPageNotFoundHero type="page" />
    <UiLink to="/" size="medium">
      {{ t('back-site-dashboard') }}
    </UiLink>
  </div>
</template>

<script setup lang="ts">
import VtsPageNotFoundHero from '@core/components/state-hero/VtsPageNotFoundHero.vue'
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
