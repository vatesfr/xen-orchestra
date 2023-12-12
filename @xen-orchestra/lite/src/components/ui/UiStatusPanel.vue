<template>
  <div class="ui-status-panel">
    <img :src="imageSource" alt="" class="image" />
    <p v-if="title !== undefined" class="title">{{ title }}</p>
    <p v-if="subtitle !== undefined" class="subtitle">{{ subtitle }}</p>
    <slot />
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  imageSource: string;
  title?: string;
  subtitle?: string;
}>();
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
  color: var(--color-extra-blue-base);
}

.title {
  font-weight: 400;
  font-size: 36px;
  text-align: center;
}

.subtitle {
  font-weight: 500;
  font-size: 24px;
  margin: 21px 0;
  text-align: center;
}

.image {
  margin-bottom: 40px;
  width: 30%;
}
</style>
