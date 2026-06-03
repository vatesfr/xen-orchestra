<template>
  <nav class="administration-menu" :aria-label="t('administration')">
    <section class="menu-section">
      <h2 class="section-title typo-body-bold">{{ t('user-management') }}</h2>
      <ul class="links">
        <li v-for="item in userManagementItems" :key="item.labelKey">
          <UiLink size="small" class="link" :href="item.href" target="_blank" rel="noopener noreferrer">
            {{ t(item.labelKey) }}
          </UiLink>
        </li>
      </ul>
    </section>
  </nav>
</template>

<script lang="ts" setup>
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { buildXo5Route } = useXoRoutes()

const userManagementItems = computed(() => [
  {
    labelKey: 'users',
    href: buildXo5Route('/settings/users'),
  },
  {
    labelKey: 'groups',
    href: buildXo5Route('/settings/groups'),
  },
  {
    labelKey: 'roles',
    href: buildXo5Route('/settings/acls'),
  },
  {
    labelKey: 'ldap-auth-providers',
    href: buildXo5Route('/settings/plugins?s=name%3A%2F%5Eauth-%2F'),
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
}

.menu-section {
  display: flex;
  flex-direction: column;
}

.section-title {
  margin: 0;
  padding: 1.2rem 1.6rem;
  color: var(--color-neutral-txt-secondary);
  border-block: 0.1rem solid var(--color-neutral-border);
  background-color: var(--color-neutral-background-secondary);
}

.links {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin: 0;
  padding: 0.4rem 0;
  list-style: none;
}

.link {
  display: flex;
  padding: 1rem 1.6rem;
  text-decoration: none;
}
</style>
