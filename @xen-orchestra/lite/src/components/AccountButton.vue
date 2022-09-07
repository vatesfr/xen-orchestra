<template>
  <AppMenu placement="bottom-end" shadow>
    <template #trigger="{ open, isOpen }">
      <button :class="{ active: isOpen }" class="account-button" @click="open">
        <UiIcon :icon="faCircleUser" class="user-icon" />
        <UiIcon :icon="faAngleDown" class="dropdown-icon" />
      </button>
    </template>
    <MenuItem :icon="faGear" @click="openSettings">{{
      $t("settings")
    }}</MenuItem>
    <MenuItem :icon="faMessage" @click="openFeedbackUrl">
      {{ $t("send-us-feedback") }}
    </MenuItem>
    <MenuItem
      :icon="faArrowRightFromBracket"
      class="menu-item-logout"
      @click="logout"
    >
      {{ $t("log-out") }}
    </MenuItem>
  </AppMenu>
</template>

<script lang="ts" setup>
import { faAngleDown, faCircleUser } from "@fortawesome/free-solid-svg-icons";
</script>

<style scoped>
.account-button {
  display: flex;
  align-items: center;
  padding: 1rem;
  color: var(--color-blue-scale-100);
  border: none;
  border-radius: 0.8rem;
  background-color: var(--background-color-secondary);
  gap: 0.8rem;

  &:disabled {
    color: var(--color-blue-scale-400);
  }

  &:not(:disabled) {
    cursor: pointer;

    &:hover,
    &:active,
    &.active {
      background-color: var(--background-color-primary);
    }

    &:active,
    &.active {
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

.menu-item-logout {
  color: var(--color-red-vates-base);
}
</style>
