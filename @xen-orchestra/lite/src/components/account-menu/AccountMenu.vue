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
    <MenuItem :icon="faBook" @click="openUrl('https://docs.xcp-ng.org?utm_campaign=xolite&utm_term=xcpdoc')">
      {{ $t('documentation-name', { name: 'XCP-ng' }) }}
    </MenuItem>
    <MenuItem
      :icon="faHeadset"
      @click="openUrl('https://vates.tech/pricing-and-support?utm_campaign=xolite&utm_term=pricing')"
    >
      {{ $t('professional-support') }}
    </MenuItem>
    <MenuItem
      :icon="faComments"
      @click="openUrl('https://xcp-ng.org/forum/topic/4731/xen-orchestra-lite?utm_campaign=xolite&utm_term=forum')"
    >
      {{ $t('access-forum') }}
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
import { faArrowRightFromBracket, faBook, faComments, faGear, faHeadset } from '@fortawesome/free-solid-svg-icons'
import { nextTick } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const logout = () => {
  const xenApiStore = useXenApiStore()
  xenApiStore.disconnect()
  nextTick(() => router.push({ name: 'home' }))
}

const openUrl = (url: string) => {
  window.open(url, '_blank', 'noopener noreferrer')
}
const openSettings = () => router.push({ name: 'settings' })
</script>

<style lang="postcss" scoped>
.menu-item-logout {
  color: var(--color-danger-txt-base);
}
</style>
