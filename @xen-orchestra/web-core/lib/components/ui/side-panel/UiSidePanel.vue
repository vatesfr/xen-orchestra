<!-- v1 -->
<template>
  <div class="ui-side-panel" :class="{ error: isError }">
    <div v-if="slots.actions && !props.busy && !isError && !isEmpty" class="actions">
      <template v-for="(action, index) in actionsToDisplay" :key="index">
        <component :is="action" />
      </template>
      <UiButtonIcon v-if="moreThanTwoActions" :icon="faEllipsis" accent="info" size="large" @click="toggleDropdown" />
      <div v-if="isDropdownOpen" class="dropdown-menu">
        <template v-for="(action, index) in additionalActions" :key="'extra-' + index">
          <component :is="action" class="dropdown-item" />
        </template>
      </div>
    </div>
    <div v-if="slots.content && !props.busy && !isError" class="content">
      <slot name="content" />
    </div>
    <UiLoader v-if="props.busy && !isError" class="loader" />
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
import { computed, ref } from 'vue'

const props = defineProps<{
  busy?: boolean
  isError?: boolean
}>()

const slots = defineSlots<{
  default(): any
  content?(): any
  actions?(): any
}>()

const isDropdownOpen = ref(false)

const moreThanTwoActions = computed(() => {
  return slots.actions && slots.actions().length > 2
})

const isEmpty = computed(() => {
  return slots.content && slots.content().length === 0
})

const actionsToDisplay = computed(() => {
  if (slots.actions) {
    return slots.actions().slice(0, 2)
  }
  return []
})

const additionalActions = computed(() => {
  if (slots.actions) {
    return slots.actions().slice(2)
  }
  return []
})

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
}
</script>

<style scoped lang="postcss">
.ui-side-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
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

  .dropdown {
    position: relative;
    display: inline-block;
  }

  .dropdown-menu {
    position: absolute;
    top: 100%;
    left: 0;
    background-color: white;
    border: 1px solid #ddd;
    box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
    padding: 8px 0;
    z-index: 1000;
  }

  .dropdown-item {
    padding: 8px 16px;
    cursor: pointer;
  }

  .dropdown-item:hover {
    background-color: #f0f0f0;
  }
}

.loader {
  font-size: 64px;
  margin: auto;
}
</style>
