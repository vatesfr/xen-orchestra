<!-- v1 -->
<template>
  <div class="ui-card-title">
    <div class="main-content">
      <div class="title typo-body-bold">
        <slot />
      </div>
      <div v-if="slots.info" class="info typo-body-bold-small">
        <slot name="info" />
      </div>
    </div>
    <p v-if="slots.description" class="description typo-body-regular-small">
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
    color: var(--color-brand-txt-base);
  }

  .description {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
