<template>
  <div class="ui-status-panel">
    <img :src="imageSource" alt="" class="image" />
    <p v-if="title !== undefined" class="title typo h2-black">{{ title }}</p>
    <p v-if="subtitle !== undefined" class="subtitle typo h3-medium">{{ subtitle }}</p>
    <slot />
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  imageSource: string
  title?: string
  subtitle?: string
}>()
</script>

<style lang="postcss" scoped>
.ui-status-panel {
  width: 100%;
  min-height: 76.5vh;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--color-brand-txt-base);
}

.title {
  text-align: center;
}

.subtitle {
  margin: 21px 0;
  text-align: center;
}

.image {
  margin-bottom: 40px;
  width: 30%;
}
</style>
