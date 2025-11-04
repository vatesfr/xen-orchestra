<template>
  <MenuList :disabled placement="bottom-end">
    <template #trigger="{ isOpen, open }">
      <UiAccountMenuButton
        v-tooltip="isOpen ? false : { content: t('account-organization-more'), placement: 'bottom-end' }"
        :selected="isOpen"
        size="medium"
        @click="open($event)"
      />
    </template>

    <MenuItem v-for="link in links" :key="link.href" class="icon" :icon="link.icon">
      <UiLink size="small" class="link typo-body-bold-small" :href="link.href" :target="link.target">
        {{ link.label }}
      </UiLink>
    </MenuItem>

    <MenuItem class="icon" icon="fa:arrow-right-from-bracket" @click="logout()">
      <span class="link typo-body-bold-small">{{ t('log-out') }}</span>
    </MenuItem>
  </MenuList>
</template>

<script lang="ts" setup>
import type { IconName } from '@core/icons'
import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import UiAccountMenuButton from '@core/components/ui/account-menu-button/UiAccountMenuButton.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { useI18n } from 'vue-i18n'

defineProps<{
  disabled?: boolean
}>()

const { t } = useI18n()

// TODO: Fetch the XO 5 mount path from API when available
const logout = () => window.location.assign('/signout')

type MenuLink = {
  icon: IconName
  label: string
  href: string
  target: '_self' | '_blank'
}

const links: MenuLink[] = [
  {
    icon: 'fa:gear',
    label: t('settings'),
    href: '/#/settings',
    target: '_self',
  },
  {
    icon: 'fa:satellite',
    label: t('license-name', { name: 'XOA' }),
    href: '/#/xoa/licenses',
    target: '_blank',
  },
  {
    icon: 'fa:book',
    label: t('documentation-name', { name: 'XO' }),
    href: 'https://docs.xen-orchestra.com',
    target: '_blank',
  },
  {
    icon: 'fa:book',
    label: t('documentation-name', { name: 'XCP-ng' }),
    href: 'https://docs.xcp-ng.org?utm_campaign=xo6&utm_term=xcpdoc',
    target: '_blank',
  },
  {
    icon: 'fa:headset',
    label: t('professional-support'),
    href: 'https://vates.tech/pricing-and-support?utm_campaign=xo6&utm_term=pricing',
    target: '_blank',
  },
  {
    icon: 'fa:code',
    label: t('documentation-name', { name: 'REST API' }),
    href: '/rest/v0/docs/#/',
    target: '_blank',
  },
  {
    icon: 'fa:message',
    label: t('send-us-feedback'),
    href: 'https://xcp-ng.org/forum/category/12/xen-orchestra',
    target: '_blank',
  },
]
</script>

<style lang="postcss" scoped>
.link {
  text-decoration: none;
  color: var(--color-brand-txt-base);
  /* Make the link take the height of the MenuItem component */
  padding-block: 1.2rem;
  /* Make the link take the available width in the MenuItem component */
  flex-grow: 1;
}

.icon {
  color: var(--color-brand-txt-base);

  &:hover {
    color: var(--color-brand-txt-hover);
  }

  &:active {
    color: var(--color-brand-txt-active);
  }
}
</style>
