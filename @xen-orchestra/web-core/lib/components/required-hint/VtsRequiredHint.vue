<template>
  <p class="vts-required-hint typo-body-regular-small">{{ t('field:required') }}</p>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.vts-required-hint::before {
  content: '*';
  margin-right: 0.4rem;
  color: var(--color-info-txt-base);
}
</style>
