<template>
  <div :class="[classNames, { horizontal, error, success, noBackground }]" class="vts-state-hero">
    <UiLoader v-if="busy" class="loader" />
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

type StateHeroType =
  | 'no-result'
  | 'under-construction'
  | 'no-data'
  | 'no-selection'
  | 'error'
  | 'not-found'
  | 'offline'
  | 'all-good'
  | 'all-done'

const {
  format,
  type,
  imageSize = 'medium',
  busy,
} = defineProps<{
  format: StateHeroFormat
  type?: StateHeroType
  imageSize?: 'extra-small' | 'small' | 'medium' | 'large'
  horizontal?: boolean
  busy?: boolean
  noBackground?: boolean
}>()

const slots = defineSlots<{
  default?(): any
}>()

const typoClass = computed(() => (format === 'page' ? 'typo-h2' : 'typo-h4'))

const classNames = computed(() => {
  return [
    toVariants({
      imageSize,
      format,
    }),
  ]
})

const error = computed(() => !busy && type === 'error')

const success = computed(() => !busy && (type === 'all-good' || type === 'all-done'))

const imageSrc = computed(() => {
  if (!type) {
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

    &.noBackground {
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
      font-size: 6.4rem;
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
      font-size: 9.6rem;
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
      font-size: 6.4rem;
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
      font-size: 9.6rem;
    }

    .image {
      order: 2;
    }
  }

  &.imageSize--extra-small {
    .image {
      max-height: 14rem;
    }
  }

  &.imageSize--small {
    .image {
      max-height: 18rem;
    }
  }

  &.imageSize--medium {
    .image {
      max-height: 30rem;
    }
  }

  &.imageSize--large {
    .image {
      max-height: 50rem;
    }
  }
}
</style>
