<template>
  <UiCard class="backup-archives-menu">
    <nav :aria-label="t('archives')">
      <ul class="menu-links">
        <MenuItem v-for="(item, index) in items" :key="index" accent="neutral">
          <UiLink size="small" class="menu-link" :to="item.to">
            {{ item.label }}
          </UiLink>
        </MenuItem>
      </ul>
    </nav>
  </UiCard>
</template>

<script lang="ts" setup>
import MenuItem from '@core/components/menu/MenuItem.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RouteLocationRaw } from 'vue-router'

type BackupArchivesMenuItem = {
  label: string
  to: RouteLocationRaw
}

const { t } = useI18n()

const items = computed<BackupArchivesMenuItem[]>(() => [
  { label: t('vms'), to: { name: '/admin/backup-and-replication/archives/vms' } },
  { label: t('backup:xo-config'), to: { name: '/admin/backup-and-replication/archives/xo-config' } },
  { label: t('backup:pool-metadata'), to: { name: '/admin/backup-and-replication/archives/pool-metadata' } },
])
</script>

<style lang="postcss" scoped>
.backup-archives-menu {
  padding: 0.4rem;

  .menu-links {
    margin: 0;
    padding: 0;

    .menu-link {
      flex-grow: 1;
      text-decoration: none;
    }
  }
}
</style>
