<template>
  <nav class="administration-menu" :aria-label="t('administration')">
    <section v-for="(section, index) in sections" :key="index" class="menu-section">
      <div class="section-title typo-h6">{{ section.title }}</div>
      <ul class="menu-links">
        <MenuItem v-for="(item, itemIndex) in section.items" :key="itemIndex" accent="neutral">
          <UiLink size="small" class="menu-link" :href="item.href" :to="item.to" @click="closeSidebarOnSmallScreen()">
            {{ item.label }}
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
import { useLeftSidebarStore } from '@core/packages/sidebar'
import { useUiStore } from '@core/stores/ui.store.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RouteLocationRaw } from 'vue-router'

type AdminMenuSection = {
  title: string
  items: {
    label: string
    href: string | undefined
    to: RouteLocationRaw | undefined
  }[]
}

const { t } = useI18n()
const { buildXo5Route } = useXoRoutes()

const uiStore = useUiStore()
const leftSidebar = useLeftSidebarStore()

function closeSidebarOnSmallScreen() {
  if (uiStore.isSmall) {
    leftSidebar.toggleExpand(false)
  }
}

const sections = computed<AdminMenuSection[]>(() => [
  {
    title: t('backup-and-replication'),
    items: [
      { label: t('jobs'), href: undefined, to: { name: '/admin/backup-and-replication/jobs' } },
      {
        label: t('backup-repositories'),
        href: undefined,
        to: { name: '/admin/backup-and-replication/backup-repositories' },
      },
      { label: t('archives'), href: buildXo5Route('/backup/restore'), to: undefined },
      { label: t('logs'), href: undefined, to: { name: '/admin/backup-and-replication/logs' } },
    ],
  },
  {
    title: t('user-management'),
    items: [
      { label: t('users'), href: undefined, to: { name: '/admin/user-management' } },
      { label: t('groups'), href: buildXo5Route('/settings/groups'), to: undefined },
      { label: t('roles'), href: buildXo5Route('/settings/acls'), to: undefined },
      {
        label: t('ldap-auth-providers'),
        href: undefined,
        to: { name: '/admin/plugins', query: { 'qb.plugins': 'name:/^auth-/' } },
      },
    ],
  },
  {
    title: t('settings'),
    items: [{ label: t('plugins'), href: undefined, to: { name: '/admin/plugins' } }],
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

  .menu-links {
    margin: 0;
    padding: 0.4rem 0;

    .menu-link {
      flex-grow: 1;
      padding-block: 1.2rem;
      text-decoration: none;
    }
  }
}
</style>
