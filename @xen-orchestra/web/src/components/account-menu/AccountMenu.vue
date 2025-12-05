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

    <MenuItem v-for="(link, index) in links" :key="index">
      <UiLink size="small" class="link typo-body-bold-small" v-bind="link.props">
        {{ link.label }}
      </UiLink>
    </MenuItem>

    <MenuItem class="icon" icon="fa:arrow-right-from-bracket" @click="logout()">
      <span class="link typo-body-bold-small">{{ t('action:log-out') }}</span>
    </MenuItem>
  </MenuList>
</template>

<script lang="ts" setup>
import { XCP_LINKS, XO_LINKS } from '@/constants.ts'
import type { IconName } from '@core/icons'
import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import UiAccountMenuButton from '@core/components/ui/account-menu-button/UiAccountMenuButton.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { type LinkOptions } from '@core/composables/link-component.composable'
import { vTooltip } from '@core/directives/tooltip.directive'
import { useI18n } from 'vue-i18n'

defineProps<{
  disabled?: boolean
}>()

const { t } = useI18n()

// TODO: Fetch the XO 5 mount path from API when available
const logout = () => window.location.assign('/signout')

const links: { label: string; props: LinkOptions & { icon: IconName } }[] = [
  {
    label: t('settings'),
    props: {
      icon: 'fa:gear',
      to: '/settings',
    },
  },
  {
    label: t('license-name', { name: t('xoa') }),
    props: {
      icon: 'fa:satellite',
      href: '/#/xoa/licenses',
    },
  },
  {
    label: t('documentation-name', { name: t('xo') }),
    props: {
      icon: 'fa:book',
      href: XO_LINKS.DOC,
    },
  },
  {
    label: t('documentation-name', { name: t('xcp-ng') }),
    props: {
      icon: 'fa:book',
      href: XCP_LINKS.DOC,
    },
  },
  {
    label: t('professional-support'),
    props: {
      icon: 'fa:headset',
      href: XCP_LINKS.SUPPORT,
    },
  },
  {
    label: t('documentation-name', { name: t('rest-api') }),
    props: {
      icon: 'fa:code',
      href: '/rest/v0/docs/#/',
    },
  },
  {
    label: t('send-us-feedback'),
    props: {
      icon: 'fa:message',
      href: XO_LINKS.COMMUNITY,
    },
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
