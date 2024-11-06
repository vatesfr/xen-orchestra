<template>
  <MenuList placement="bottom-end" border>
    <template #trigger="{ open, isOpen }">
      <UiAccountMenuButton
        v-tooltip="isOpen ? false : { content: $t('settings'), placement: 'left' }"
        :selected="isOpen"
        size="medium"
        @click="open($event)"
      />
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
import { useXenApiStore } from '@/stores/xen-api.store'
import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import UiAccountMenuButton from '@core/components/ui/account-menu-button/UiAccountMenuButton.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { faArrowRightFromBracket, faGear, faMessage } from '@fortawesome/free-solid-svg-icons'
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
.menu-item-logout {
  color: var(--color-danger-txt-base);
}
</style>
