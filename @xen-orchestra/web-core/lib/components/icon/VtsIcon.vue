<!-- WIP -->
<template>
  <UiLoader v-if="busy" class="vts-icon" />
  <div v-else-if="overlayIcon !== undefined && icon !== undefined" class="vts-icon stacked" :class="accent">
    <FontAwesomeIcon :fixed-width="fixedWidth" :icon />
    <FontAwesomeIcon class="overlay-icon" :fixed-width="fixedWidth" :icon="overlayIcon" />
  </div>
  <FontAwesomeIcon v-else-if="icon !== undefined" :class="accent" :fixed-width="fixedWidth" :icon class="vts-icon" />
</template>

<script lang="ts" setup>
import UiLoader from '@core/components/ui/loader/UiLoader.vue'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

export type IconAccent = 'current' | 'brand' | 'info' | 'success' | 'warning' | 'danger'

defineProps<{
  accent: IconAccent
  icon?: IconDefinition
  overlayIcon?: IconDefinition
  busy?: boolean
  fixedWidth?: boolean
}>()
</script>

<style lang="postcss" scoped>
.vts-icon {
  &.stacked {
    display: inline-grid;
    place-items: center;

    svg {
      grid-area: 1 / -1;

      &:last-child {
        font-size: 50%;
      }
    }
  }

  /* COLOR VARIANTS */

  &.current {
    color: currentColor;

    .overlay-icon {
      color: var(--color-neutral-background-primary);
    }
  }

  &.brand {
    color: var(--color-info-item-base);

    .overlay-icon {
      color: var(--color-info-txt-item);
    }
  }

  &.info {
    color: var(--color-info-item-base);

    .overlay-icon {
      color: var(--color-info-txt-item);
    }
  }

  &.success {
    color: var(--color-success-item-base);

    .overlay-icon {
      color: var(--color-success-txt-item);
    }
  }

  &.warning {
    color: var(--color-warning-item-base);

    .overlay-icon {
      color: var(--color-warning-txt-item);
    }
  }

  &.danger {
    color: var(--color-danger-item-base);

    .overlay-icon {
      color: var(--color-danger-txt-item);
    }
  }
}
</style>
