<template>
  <button class="account-button">
    <FontAwesomeIcon class="user-icon" :icon="faCircleUser" />
    <FontAwesomeIcon class="dropdown-icon" :icon="faAngleDown" />
  </button>
</template>

<script lang="ts" setup>
import { faAngleDown } from "@fortawesome/pro-light-svg-icons";
import { faCircleUser } from "@fortawesome/pro-solid-svg-icons";
</script>

<style scoped>
.account-button {
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  border-radius: 0.8rem;
  border: none;
  color: var(--color-blue-scale-100);
  background-color: var(--background-color-secondary);

  &:disabled {
    color: var(--color-blue-scale-400);
  }

  &:not(:disabled) {
    cursor: pointer;
    &:hover,
    &:active {
      background-color: var(--background-color-primary);
    }

    &:active {
      color: var(--color-extra-blue-base);
    }
  }
}

.user-icon {
  font-size: 2.4rem;
}

.dropdown-icon {
  font-size: 1.6rem;
}
</style>
