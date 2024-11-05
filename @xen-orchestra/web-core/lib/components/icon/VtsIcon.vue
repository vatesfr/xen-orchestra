<!-- WIP -->
<template>
  <UiSpinner v-if="busy" class="vts-icon" />
  <div v-else-if="overlayIcon !== undefined && icon !== undefined" class="vts-icon stacked" :class="accent">
    <FontAwesomeIcon :fixed-width="fixedWidth" :icon />
    <FontAwesomeIcon class="overlay-icon" :fixed-width="fixedWidth" :icon="overlayIcon" />
  </div>
  <FontAwesomeIcon v-else-if="icon !== undefined" :class="accent" :fixed-width="fixedWidth" :icon class="vts-icon" />
</template>

<script lang="ts" setup>
import UiSpinner from '@core/components/UiSpinner.vue'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

export type IconAccent = 'current' | 'info' | 'success' | 'warning' | 'danger'

defineProps<{
  accent: IconAccent
  icon?: IconDefinition
  overlayIcon?: IconDefinition
  busy?: boolean
  fixedWidth?: boolean
}>()
</script>

<style lang="postcss" scoped>
/*
ACCENT
--vts-icon--color
--vts-icon__overlay-icon--color
*/
.vts-icon {
  &.current {
    --vts-icon--color: currentColor;

    &.stacked {
      --vts-icon__overlay-icon--color: var(--color-neutral-background-primary);
    }
  }

  &.info {
    --vts-icon--color: var(--color-info-item-base);

    &.stacked {
      --vts-icon__overlay-icon--color: var(--color-info-txt-item);
    }
  }

  &.success {
    --vts-icon--color: var(--color-success-item-base);

    &.stacked {
      --vts-icon__overlay-icon--color: var(--color-success-txt-item);
    }
  }

  &.warning {
    --vts-icon--color: var(--color-warning-item-base);

    &.stacked {
      --vts-icon__overlay-icon--color: var(--color-warning-txt-item);
    }
  }

  &.danger {
    --vts-icon--color: var(--color-danger-item-base);

    &.stacked {
      --vts-icon__overlay-icon--color: var(--color-danger-txt-item);
    }
  }
}

/* IMPLEMENTATION */
.vts-icon {
  color: var(--vts-icon--color);

  &.stacked {
    display: inline-grid;
    place-items: center;

    .overlay-icon {
      color: var(--vts-icon__overlay-icon--color);
    }

    svg {
      grid-area: 1 / -1;

      &:last-child {
        font-size: 0.75rem;
      }
    }
  }
}
</style>
