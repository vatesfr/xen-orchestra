<template>
  <div class="state-hero">
    <UiSpinner v-if="busy" class="spinner" />
    <img v-else-if="imageSrc" :src="imageSrc" alt="" class="image" />
    <p v-if="$slots.default" class="typo h2-black text">
      <slot />
    </p>
  </div>
</template>

<script lang="ts" setup>
import UiSpinner from '@core/components/UiSpinner.vue'
import { computed } from 'vue'

const props = defineProps<{
  busy?: boolean
  image?: 'no-result' | 'under-construction' // TODO: 'offline' | 'no-data' |  'not-found' | 'all-good' | 'all-done' | 'error'
}>()

const imageSrc = computed(() => {
  try {
    return new URL(`../../assets/${props.image}.svg`, import.meta.url).href
  } catch {
    return undefined
  }
})
</script>

<style lang="postcss" scoped>
.state-hero {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4.2rem;
}

.image {
  width: 90%;
  max-width: 55rem;
}

.spinner {
  color: var(--color-purple-base);
  font-size: 10rem;
}

.text {
  color: var(--color-purple-base);
  margin-top: 4rem;
}
</style>
