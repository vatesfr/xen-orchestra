<template>
  <div :class="[type, { error }]" class="vts-state-hero">
    <UiLoader v-if="busy" class="loader" />
    <img v-else-if="imageSrc" :src="imageSrc" alt="" class="image" />
    <p v-if="slots.default" :class="typoClass" class="text">
      <slot />
    </p>
  </div>
</template>

<script lang="ts" setup>
import UiLoader from '@core/components/ui/loader/UiLoader.vue'
import { computed } from 'vue'

export type StateHeroType = 'page' | 'card' | 'panel' | 'table'

const props = defineProps<{
  type: StateHeroType
  busy?: boolean
  image?: 'no-result' | 'under-construction' | 'no-data' | 'no-selection' | 'error-no-data' | 'not-found' // TODO: 'offline' |  'not-found' | 'all-good' | 'all-done''
}>()

const slots = defineSlots<{
  default?(): any
}>()

const typoClass = computed(() => (props.type === 'page' ? 'typo h2-black' : 'typo h4-medium'))
const error = computed(() => !props.busy && props.image === 'error-no-data')

const imageSrc = computed(() => {
  if (!props.image) {
    return undefined
  }

  return new URL(`../../assets/${props.image}.svg`, import.meta.url).href
})
</script>

<style lang="postcss" scoped>
.vts-state-hero {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  &.error {
    background-color: var(--color-danger-background-selected);

    .text {
      color: var(--color-danger-txt-base);
    }
  }

  .loader,
  .text {
    color: var(--color-info-txt-base);
  }

  .image {
    order: 2;
  }

  .text {
    order: 3;
  }

  &.page {
    gap: 2.4rem;

    .text {
      order: 3;
    }

    .loader {
      order: 1;
      font-size: 10rem;
    }

    .image {
      order: 2;
      width: 90%;
      max-height: none;
    }
  }

  &.card {
    gap: 2rem;

    .text {
      order: 3;
    }

    .loader {
      font-size: 6rem;
      order: 1;
    }

    .image {
      order: 2;
      width: 70%;
      max-height: 20rem;
    }
  }

  &.panel {
    gap: 4rem;
    justify-content: unset;
    padding-top: 8rem;

    .text {
      order: 3;
    }

    .loader {
      order: 1;
      font-size: 6.4rem;
    }

    .image {
      order: 2;
      width: 80%;
    }
  }

  &.table {
    padding: 5rem;
    gap: 2.4rem;

    .text {
      order: 3;
    }

    .image {
      order: 2;
      max-height: 20rem;
    }

    .loader {
      order: 1;
      font-size: 10rem;
    }
  }
}
</style>
