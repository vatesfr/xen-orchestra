<!-- WIP -->
<template>
  <div :class="accent" class="vts-label">
    <VtsIcon accent="current" :icon class="left-icon" />
    <span :class="{ required }" class="typo c2-semi-bold label"><slot /></span>
    <!-- @TODO: Replace it by the VtsLink component when available -->
    <a v-if="href" :href class="link">
      <span class="typo p3-regular-underline">{{ $t('learn-more') }}</span>
      <VtsIcon accent="current" :icon="faUpRightFromSquare" class="link-icon" />
    </a>
  </div>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { faUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'

defineProps<{
  accent: 'brand' | 'warning' | 'danger'
  icon?: IconDefinition
  required?: boolean
  href?: string
}>()
</script>

<style lang="postcss" scoped>
/**
ACCENT
--vts-label--color
*/
.vts-label {
  &.brand {
    --vts-label--color: var(--color-neutral-txt-primary);
  }

  &.warning {
    --vts-label--color: var(--color-warning-txt-base);
  }

  &.danger {
    --vts-label--color: var(--color-danger-txt-base);
  }
}

/* IMPLEMENTATION */
.vts-label {
  display: flex;
  align-items: center;

  .left-icon {
    margin-right: 0.8rem;
  }

  .label {
    color: var(--vts-label--color);

    &.required::after {
      content: '*';
      margin-left: 0.4rem;
      color: var(--color-info-txt-base);
    }
  }

  .link {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    margin-left: auto;
  }

  .link-icon {
    font-size: 0.8rem;
  }
}
</style>
