<!-- v1 -->
<template>
  <div class="ui-side-panel" :class="{ error: isError }">
    <div v-if="slots.header && !props.busy && !isError && !isEmpty" class="header">
      <slot name="header" />
    </div>
    <div v-if="slots.content && !props.busy && !isError" class="content">
      <slot name="content" />
    </div>
    <div v-if="!props.busy && isError" class="error">
      <div v-if="!props.busy && !slots.content" class="empty" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  busy?: boolean
  isError?: boolean
}>()

const slots = defineSlots<{
  default(): any
  header?(): any
  content?(): any
}>()

const isEmpty = computed(() => slots.content?.().length === 0)
</script>

<style scoped lang="postcss">
.ui-side-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  border: 0.1rem solid var(--color-neutral-border);
  background-color: var(--color-neutral-background-secondary);

  .header {
    border-bottom: 0.1rem solid var(--color-neutral-border);
    background-color: var(--color-neutral-background-primary);
    display: flex;
    justify-content: flex-end;
    padding: 4px 16px;
  }

  .content {
    display: flex;
    flex-direction: column;
    padding: 0.8rem;
    gap: 0.8rem;
  }

  &.error {
    padding-top: 15rem;
    background-color: var(--color-danger-background-selected);
  }
}
</style>
