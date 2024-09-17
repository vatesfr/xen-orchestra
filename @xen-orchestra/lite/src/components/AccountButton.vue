<template>
  <MenuList placement="bottom-end" shadow>
    <template #trigger="{ open, isOpen }">
      <button type="button" :class="{ active: isOpen }" class="account-button" @click="open">
        <UiIcon :icon="faCircleUser" class="user-icon" />
        <UiIcon :icon="faAngleDown" class="dropdown-icon" />
      </button>
    </template>
    <MenuItem :icon="faGear" @click="openSettings">{{ $t('settings') }}</MenuItem>
    <MenuItem :icon="faMessage" @click="openFeedbackUrl">
      {{ $t('send-us-feedback') }}
    </MenuItem>
    <MenuItem :icon="faArrowRightFromBracket" class="menu-item-logout" @click="logout">
      {{ $t('log-out') }}
    </MenuItem>
  </MenuList>
</template>

<script lang="ts" setup>
import UiIcon from '@/components/ui/icon/UiIcon.vue'
import { useXenApiStore } from '@/stores/xen-api.store'
import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import {
  faAngleDown,
  faArrowRightFromBracket,
  faCircleUser,
  faGear,
  faMessage,
} from '@fortawesome/free-solid-svg-icons'
import { nextTick } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const logout = () => {
  const xenApiStore = useXenApiStore()
  xenApiStore.disconnect()
  nextTick(() => router.push({ name: 'home' }))
}

const openFeedbackUrl = () => {
  window.open('https://xcp-ng.org/forum/topic/4731/xen-orchestra-lite', '_blank', 'noopener')
}

const openSettings = () => router.push({ name: 'settings' })
</script>

<style lang="postcss" scoped>
.account-button {
  display: flex;
  align-items: center;
  padding: 1rem;
  color: var(--color-neutral-txt-primary);
  border: none;
  border-radius: 0.8rem;
  background-color: var(--color-neutral-background-secondary);
  gap: 0.8rem;

  &:disabled {
    color: var(--color-neutral-border);
  }

  &:not(:disabled) {
    cursor: pointer;

    &:hover,
    &:active,
    &.active {
      background-color: var(--color-neutral-background-primary);
    }

    &:active,
    &.active {
      color: var(--color-normal-txt-base);
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
  color: var(--color-danger-txt-base);
}
</style>
