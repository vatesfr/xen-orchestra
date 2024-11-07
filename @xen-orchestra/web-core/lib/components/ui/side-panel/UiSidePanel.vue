<!-- v1 -->
<template>
  <div class="ui-side-panel" :class="{ error: isError }">
    <div v-if="slots.actions && !props.busy && !isError" class="actions">
      <slot name="actions" />
      <UiButtonIcon v-if="moreThanTwoActions" :icon="faEllipsis" accent="info" size="large" />
    </div>
    <div v-if="slots.content && !props.busy && !isError" class="content">
      <slot name="content" />
    </div>
    <UiLoader v-if="props.busy" class="loader" />
    <div v-if="!props.busy && isError" class="error">
      <div class="typo h4-medium" />
    </div>
    <div v-if="!props.busy && !slots.content" class="empty" />
  </div>
</template>

<script setup lang="ts">
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiLoader from '@core/components/ui/loader/UiLoader.vue'
import { faEllipsis } from '@fortawesome/free-solid-svg-icons'
import { onMounted, ref } from 'vue'

const props = defineProps<{
  busy?: boolean
  isError?: boolean
}>()

const slots = defineSlots<{
  default(): any
  content?(): any
  actions?(): any
}>()

const moreThanTwoActions = ref(false)

onMounted(() => {
  if (slots.content) {
    const contentItems = slots.content()
    moreThanTwoActions.value = contentItems.length > 2
  }
})
</script>

<style scoped lang="postcss">
.ui-side-panel {
  height: 100%;
  border: 0.1rem solid var(--color-neutral-border);
  background-color: var(--color-neutral-background-secondary);

  .actions {
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
    color: var(--color-danger-txt-base);
    background-color: var(--color-danger-background-selected);
  }
}

.loader {
  font-size: 64px;
  margin: auto;
}
</style>
