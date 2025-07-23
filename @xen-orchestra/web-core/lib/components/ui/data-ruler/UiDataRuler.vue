<!-- v1 -->
<template>
  <div class="ui-data-ruler typo-body-regular-small">
    <span>{{ t('n-percent', 0) }}</span>
    <span>{{ t('n-percent', 50) }}</span>
    <span>{{ t('n-percent', 100) }}</span>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.ui-data-ruler {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  color: var(--color-neutral-txt-secondary);
}
</style>
