<template>
  <div :class="[className, { horizontal, error, success, 'no-background': noBackground }]" class="vts-state-hero">
    <UiLoader v-if="type === 'busy'" class="loader" />
    <img v-else-if="imageSrc" :src="imageSrc" :alt="type" class="image" />
    <div v-if="slots.default" :class="typoClass" class="content">
      <slot />
    </div>
  </div>
</template>

<script lang="ts" setup>
import UiLoader from '@core/components/ui/loader/UiLoader.vue'
import { toVariants } from '@core/utils/to-variants.util.ts'
import { computed } from 'vue'

export type StateHeroFormat = 'page' | 'card' | 'panel' | 'table'

export type StateHeroType =
  | 'busy'
  | 'no-result'
  | 'under-construction'
  | 'no-data'
  | 'no-selection'
  | 'error'
  | 'not-found'
  | 'offline'
  | 'all-good'
  | 'all-done'

const { format, type, size } = defineProps<{
  format: StateHeroFormat
  type: StateHeroType
  size: 'extra-small' | 'small' | 'medium' | 'large'
  horizontal?: boolean
  noBackground?: boolean
}>()

const slots = defineSlots<{
  default?(): any
}>()

const typoClass = computed(() => (format === 'page' ? 'typo-h2' : 'typo-h4'))

const className = computed(() => toVariants({ size, format }))

const error = computed(() => type === 'error')

const success = computed(() => type === 'all-good' || type === 'all-done')

const imageSrc = computed(() => {
  if (type === 'busy') {
    return undefined
  }

  return new URL(`../../assets/${type}.svg`, import.meta.url).href
})
</script>

<style lang="postcss" scoped>
.vts-state-hero {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2.4rem;

  &:not(.horizontal) {
    flex-direction: column;

    .content {
      align-items: center;
    }
  }

  .image {
    order: 2;
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
  }

  .loader,
  .content {
    order: 3;
    color: var(--color-brand-txt-base);
  }

  &.success {
    .content {
      color: var(--color-success-txt-base);
    }
  }

  &.error {
    background-color: var(--color-danger-background-selected);

    &.no-background {
      background-color: transparent;
    }

    .content {
      color: var(--color-danger-txt-base);
    }
  }

  &.format--card {
    gap: 2rem;

    .content {
      order: 3;
    }

    .loader {
      order: 1;
    }

    .image {
      order: 2;
    }
  }

  &.format--table {
    padding: 4rem;
    gap: 2.4rem;

    .content {
      order: 3;
    }

    .loader {
      order: 1;
    }

    .image {
      order: 2;
    }
  }

  &.format--panel {
    gap: 4rem;
    justify-content: unset;
    padding-top: 8rem;

    .content {
      order: 1;
    }

    .loader {
      order: 3;
    }

    .image {
      order: 2;
    }
  }

  &.format--page {
    gap: 10rem;

    .content {
      order: 3;
    }

    .loader {
      order: 1;
    }

    .image {
      order: 2;
    }
  }

  &.size--extra-small {
    .loader {
      font-size: 1.6rem;
    }

    .image {
      max-height: 14rem;
    }
  }

  &.size--small {
    .loader {
      font-size: 2.4rem;
    }

    .image {
      max-height: 18rem;
    }
  }

  &.size--medium {
    .loader {
      font-size: 6.4rem;
    }

    .image {
      max-height: 30rem;
    }
  }

  &.size--large {
    .loader {
      font-size: 9.6rem;
    }
    .image {
      max-height: 50rem;
    }
  }
}
</style>
