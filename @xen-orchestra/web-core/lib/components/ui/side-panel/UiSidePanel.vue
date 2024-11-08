<!-- v1 -->
<template>
  <div class="ui-side-panel" :class="{ error: isError }">
    <div v-if="slots.actions && !props.busy && !isError && !isEmpty" class="actions">
      <template v-for="(action, index) in actionsToDisplay" :key="index">
        <component :is="action" />
      </template>
      <UiButtonIcon v-if="moreThanTwoActions" :icon="faEllipsis" accent="info" size="large" @click="toggleDropdown" />
      <DropdownList v-if="isDropdownOpen" class="dropdown-menu">
        <template v-for="(action, index) in additionalActions" :key="'extra-' + index">
          <component :is="action" class="dropdown-item" />
        </template>
      </DropdownList>
    </div>
    <div v-if="slots.content && !props.busy && !isError" class="content">
      <slot name="content" />
    </div>
    <VtsStateHero v-if="busy" type="card" busy />
    <div v-if="!props.busy && isError" class="error">
      <div v-if="!props.busy && !slots.content" class="empty" />
    </div>
  </div>
</template>

<script setup lang="ts">
import DropdownList from '@core/components/dropdown/DropdownList.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
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

const moreThanTwoActions = computed(() => slots.actions?.().length > 2)

const isEmpty = computed(() => slots.content?.().length === 0)

const actionsToDisplay = computed(() => (slots.actions ? slots.actions().slice(0, 2) : []))

const additionalActions = computed(() => (slots.actions ? slots.actions().slice(2) : []))

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
}
</script>

<style scoped lang="postcss">
.ui-side-panel {
  //height: 100%;
  height: 100vh;
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
    padding-top: 15rem;
    background-color: var(--color-danger-background-selected);
  }

  .dropdown-menu {
    position: absolute;
    top: 100%;
    right: 0;
    z-index: 1000;
    gap: 0.8rem;
    padding-inline: 0.8rem;
  }

  .dropdown-item {
    padding: 8px 16px;
    cursor: pointer;
  }

  .dropdown-item:hover {
    background-color: #f0f0f0;
  }
}
</style>
