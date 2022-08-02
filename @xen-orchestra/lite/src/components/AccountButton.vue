<template>
  <AppMenu placement="bottom-end">
    <template #trigger="{ open, isOpen }">
      <button type="button" class="account-button" :class="{ active: isOpen }" @click="open">
        <FontAwesomeIcon class="user-icon" :icon="faCircleUser" />
        <FontAwesomeIcon class="dropdown-icon" :icon="faAngleDown" />
      </button>
    </template>
    <AppMenuItem :icon="faGear">Settings</AppMenuItem>
    <AppMenuItem :icon="faMessageExclamation">Send us feedback</AppMenuItem>
    <AppMenuItem :icon="faArrowRightFromBracket" @click="logout">
      Log out
    </AppMenuItem>
  </AppMenu>
</template>

<script lang="ts" setup>
import AppMenu from '@/components/AppMenu.vue';
import AppMenuItem from '@/components/AppMenuItem.vue';
import { useXenApiStore } from '@/stores/xen-api.store';
import { faCircleUser } from "@fortawesome/pro-solid-svg-icons";
import {
  faAngleDown,
  faArrowRightFromBracket,
  faGear,
  faMessageExclamation,
} from "@fortawesome/pro-light-svg-icons";
import { nextTick } from 'vue';
import { useRouter } from 'vue-router';

defineProps<{
  active?: boolean;
}>();

const xenApiStore = useXenApiStore();
const router = useRouter();

const logout = () => {
  xenApiStore.disconnect();
  nextTick(() => router.push({ name: "home" }));
};
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
</style>
