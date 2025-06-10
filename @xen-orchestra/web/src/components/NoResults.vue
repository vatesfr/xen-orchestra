<template>
  <div class="no-results typo-body-bold">{{ t('no-results') }}</div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.no-results {
  background-color: var(--color-neutral-background-primary);
  padding: 0.8rem;
  height: 100%;
}
</style>
