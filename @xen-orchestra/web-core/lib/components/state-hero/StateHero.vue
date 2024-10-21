<template>
  <div :class="type" class="state-hero">
    <UiSpinner v-if="busy" class="spinner" />
    <img v-else-if="imageSrc" :src="imageSrc" alt="" class="image" />
    <p v-if="$slots.default" :class="typoClass" class="typo text">
      <slot />
    </p>
  </div>
</template>

<script lang="ts" setup>
import UiSpinner from '@core/components/UiSpinner.vue'
import { computed } from 'vue'

export type StateHeroType = 'page' | 'card'

const props = defineProps<{
  type: StateHeroType
  busy?: boolean
  image?: 'no-result' | 'under-construction' | 'no-data' // TODO: 'offline' |  'not-found' | 'all-good' | 'all-done' | 'error'
}>()

const typoClass = computed(() => (props.type === 'page' ? 'h2-black' : 'h4-medium'))

const imageSrc = computed(() => {
  if (!props.image) {
    return undefined
  }

  return new URL(`../../assets/${props.image}.svg`, import.meta.url).href
})
</script>

<style lang="postcss" scoped>
.state-hero {
  &.page {
    --image-width: 90%;
    --image-max-height: none;
    --spinner-size: 10rem;
    --gap: 8.2rem;
  }

  &.card {
    --image-width: 70%;
    --image-max-height: 20rem;
    --spinner-size: 6rem;
    --gap: 2rem;
  }
}

.state-hero {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--gap);
}

.image {
  width: var(--image-width);
  max-width: 55rem;
  max-height: var(--image-max-height);
}

.spinner {
  color: var(--color-info-txt-base);
  font-size: var(--spinner-size);
}

.text {
  color: var(--color-info-txt-base);
}
</style>
