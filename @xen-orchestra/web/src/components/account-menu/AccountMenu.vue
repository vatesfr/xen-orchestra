<template>
  <AccountMenuTrigger v-bind="omit(menu.$trigger, ['as', 'submenu'])" />

  <VtsMenuList border v-bind="menu.$target">
    <VtsMenuItem :icon="faBook" v-bind="menu.documentation">
      {{ $t('documentation-name', { name: 'XCP-ng' }) }}
    </VtsMenuItem>
    <VtsMenuItem :icon="faHeadset" v-bind="menu.support">
      {{ $t('professional-support') }}
    </VtsMenuItem>
    <VtsMenuItem :icon="faArrowRightFromBracket" class="logout" v-bind="menu.logout">
      {{ $t('log-out') }}
    </VtsMenuItem>
  </VtsMenuList>
</template>

<script lang="ts" setup>
import AccountMenuTrigger from '@/components/account-menu/AccountMenuTrigger.vue'
import VtsMenuItem from '@core/components/menu/VtsMenuItem.vue'
import VtsMenuList from '@core/components/menu/VtsMenuList.vue'
import { link, useMenuToggle } from '@core/packages/menu'
import { faArrowRightFromBracket, faBook, faHeadset } from '@fortawesome/free-solid-svg-icons'
import { objectOmit as omit } from '@vueuse/core'

defineProps<{
  disabled?: boolean
}>()

const menu = useMenuToggle({
  placement: 'bottom-end',
  items: {
    documentation: link('https://docs.xcp-ng.org?utm_campaign=xo6&utm_term=xcpdoc'),
    support: link('https://vates.tech/pricing-and-support?utm_campaign=xo6&utm_term=pricing'),
    logout: link('/signout', { target: '_self' }), // TODO: Fetch the XO 5 mount path from API when available
  },
})
</script>

<style lang="postcss" scoped>
.logout {
  color: var(--color-danger-txt-base);
}
</style>
