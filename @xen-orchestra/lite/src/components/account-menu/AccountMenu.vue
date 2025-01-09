<template>
  <UiAccountMenuButton
    v-tooltip="menu.$isOpen ? false : { content: $t('settings'), placement: 'left' }"
    size="medium"
    v-bind="omit(menu.$trigger, ['as', 'submenu'])"
  />

  <VtsMenuList border v-bind="menu.$target">
    <VtsMenuItem :icon="faGear" v-bind="menu.settings">{{ $t('settings') }}</VtsMenuItem>
    <VtsMenuItem :icon="faBook" v-bind="menu.documentation">
      {{ $t('documentation-name', { name: 'XCP-ng' }) }}
    </VtsMenuItem>
    <VtsMenuItem :icon="faHeadset" v-bind="menu.support">{{ $t('professional-support') }}</VtsMenuItem>
    <VtsMenuItem :icon="faComments" v-bind="menu.forum">{{ $t('access-forum') }}</VtsMenuItem>
    <VtsMenuItem :icon="faArrowRightFromBracket" class="menu-item-logout" v-bind="menu.logout">
      {{ $t('log-out') }}
    </VtsMenuItem>
  </VtsMenuList>
</template>

<script lang="ts" setup>
import { useXenApiStore } from '@/stores/xen-api.store'
import VtsMenuItem from '@core/components/menu/VtsMenuItem.vue'
import VtsMenuList from '@core/components/menu/VtsMenuList.vue'
import UiAccountMenuButton from '@core/components/ui/account-menu-button/UiAccountMenuButton.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { action, link, routerLink, useMenuToggle } from '@core/packages/menu'
import { faArrowRightFromBracket, faBook, faComments, faGear, faHeadset } from '@fortawesome/free-solid-svg-icons'
import { objectOmit as omit } from '@vueuse/shared'
import { useRouter } from 'vue-router'

const router = useRouter()

const menu = useMenuToggle({
  placement: 'bottom-end',
  items: {
    settings: routerLink({ name: 'settings' }),
    documentation: link('https://docs.xcp-ng.org?utm_campaign=xolite&utm_term=xcpdoc'),
    support: link('https://vates.tech/pricing-and-support?utm_campaign=xolite&utm_term=pricing'),
    forum: link('https://xcp-ng.org/forum/topic/4731/xen-orchestra-lite?utm_campaign=xolite&utm_term=forum'),
    logout: action(async () => {
      await useXenApiStore().disconnect()
      void router.push({ name: 'home' })
    }),
  },
})
</script>

<style lang="postcss" scoped>
:deep(.menu-item-logout) {
  color: var(--color-danger-txt-base);
}
</style>
