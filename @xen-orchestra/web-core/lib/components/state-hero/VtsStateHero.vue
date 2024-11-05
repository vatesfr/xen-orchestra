<template>
  <div :class="type" class="vts-state-hero">
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

export type StateHeroType = 'page' | 'card'

const props = defineProps<{
  type: StateHeroType
  busy?: boolean
  image?: 'no-result' | 'under-construction' | 'no-data' // TODO: 'offline' |  'not-found' | 'all-good' | 'all-done' | 'error'
}>()

const slots = defineSlots<{
  default?(): any
}>()

const typoClass = computed(() => (props.type === 'page' ? 'typo h2-black' : 'typo h4-medium'))

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

  .image {
    max-width: 55rem;
  }

  .loader,
  .text {
    color: var(--color-info-txt-base);
  }

  &.page {
    gap: 8.2rem;

    .image {
      width: 90%;
      max-height: none;
    }

    .loader {
      font-size: 10rem;
    }
  }

  &.card {
    gap: 2rem;

    .image {
      width: 70%;
      max-height: 20rem;
    }

    .loader {
      font-size: 6rem;
    }
  }
}
</style>
