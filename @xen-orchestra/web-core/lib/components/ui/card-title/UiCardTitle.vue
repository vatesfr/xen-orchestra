<!-- v1 -->
<template>
  <div class="ui-card-title">
    <div class="main-content">
      <div class="title typo h6-medium">
        <slot />
      </div>
      <div v-if="slots.info" class="info typo h7-semi-bold">
        <slot name="info" />
      </div>
    </div>
    <p v-if="slots.description" class="description typo p3-regular">
      <slot name="description" />
    </p>
  </div>
</template>

<script lang="ts" setup>
const slots = defineSlots<{
  default(): any
  info?(): any
  description?(): any
}>()
</script>

<style lang="postcss" scoped>
.ui-card-title {
  display: flex;
  flex-direction: column;

  .main-content {
    display: flex;
    gap: 1.6rem;
    align-items: center;
  }

  .title {
    display: flex;
    align-items: center;
    gap: 1.6rem;
    color: var(--color-neutral-txt-primary);
  }

  .info {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 0.8rem;
    color: var(--color-info-txt-base);
  }

  .description {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
