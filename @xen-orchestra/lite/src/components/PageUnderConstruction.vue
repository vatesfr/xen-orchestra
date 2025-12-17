<template>
  <VtsStateHero format="page" type="under-construction" size="large">
    <span>{{ t('xo-lite-under-construction') }}</span>
    <span class="typo-h3">{{ t('new-features-are-coming!') }}</span>
    <p class="contact typo-body-regular">
      {{ t('do-you-have-needs') }}
      <a
        href="https://xcp-ng.org/forum/topic/5018/xo-lite-building-an-embedded-ui-in-xcp-ng"
        rel="noopener noreferrer"
        target="_blank"
      >
        {{ `${t('here')} →` }}
      </a>
    </p>
  </VtsStateHero>
</template>

<script lang="ts" setup>
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.contact {
  color: var(--color-neutral-txt-primary);

  & a {
    text-transform: lowercase;
  }
}
</style>
