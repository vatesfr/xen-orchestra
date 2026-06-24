<template>
  <nav class="administration-menu" :aria-label="t('administration')">
    <section v-for="section in sections" :key="section.titleKey" class="menu-section">
      <div class="section-title typo-h6">{{ t(section.titleKey) }}</div>
      <ul class="links">
        <MenuItem v-for="item in section.items" :key="item.labelKey">
          <UiLink size="small" class="link" :href="item.href" :to="item.to">
            {{ t(item.labelKey) }}
          </UiLink>
        </MenuItem>
      </ul>
    </section>
  </nav>
</template>

<script lang="ts" setup>
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RouteLocationRaw } from 'vue-router'

type AdminMenuSection = {
  titleKey: string
  items: {
    labelKey: string
    href: string | undefined
    to: RouteLocationRaw | undefined
  }[]
}

const { t } = useI18n()
const { buildXo5Route } = useXoRoutes()

const sections = computed<AdminMenuSection[]>(() => [
  {
    titleKey: 'user-management',
    items: [
      { labelKey: 'users', href: undefined, to: `/administration/user-management` },
      { labelKey: 'groups', href: buildXo5Route('/settings/groups'), to: undefined },
      { labelKey: 'roles', href: buildXo5Route('/settings/acls'), to: undefined },
      {
        labelKey: 'ldap-auth-providers',
        href: buildXo5Route('/settings/plugins?s=name%3A%2F%5Eauth-%2F'),
        to: undefined,
      },
    ],
  },
])
</script>

<style lang="postcss" scoped>
.administration-menu {
  display: flex;
  height: 100%;
  flex-direction: column;
  color: var(--color-neutral-txt-primary);
  background-color: var(--color-neutral-background-primary);

  .section-title {
    margin: 0;
    padding: 0.8rem 0.8rem 0.4rem 1.2rem;
    color: var(--color-neutral-txt-secondary);
    border-block-end: 0.1rem solid var(--color-neutral-border);
    background-color: var(--color-neutral-background-secondary);
  }

  .menu-section:first-child .section-title {
    border-block-start: 0.1rem solid var(--color-neutral-border);
  }

  .links {
    margin: 0;
    padding: 0.4rem 0;
    list-style: none;

    .link {
      flex-grow: 1;
      padding-block: 1.2rem;
      text-decoration: none;
    }
  }
}
</style>
