<template>
  <VtsStateHero v-if="isLoading" format="card" type="busy" size="medium" />
  <VtsStateHero v-else-if="migrations.length === 0" format="card" type="no-data" size="medium">
    {{ t('load-balancer:no-migrations-needed') }}
  </VtsStateHero>
  <div v-else class="load-balancer-migration-preview">
    <div v-for="[groupKey, entries] of groupedMigrations" :key="groupKey" class="migration-group">
      <div class="group-header typo-body-bold-small">
        <UiTag :accent="reasonAccent(entries)" variant="secondary">
          {{ entries[0].reason }}
        </UiTag>
        <span>{{ entries[0].group }}</span>
        <span class="count">{{ t('load-balancer:migration-count', { count: entries.length }) }}</span>
      </div>
      <div v-for="migration of entries" :key="migration.vmId" class="migration-row">
        <span class="vm typo-body-regular-small">{{ migration.vmName }}</span>
        <span class="hosts typo-body-regular-small">
          {{ t('load-balancer:migration-to', { from: migration.currentHostName, to: migration.targetHostName }) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { MigrationEntry } from '@/modules/pool/types/load-balancer.type.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { migrations, isLoading } = defineProps<{
  migrations: MigrationEntry[]
  isLoading: boolean
}>()

const { t } = useI18n()

type TagAccent = 'info' | 'neutral' | 'success' | 'warning' | 'danger' | 'muted'

const REASON_ACCENTS: Record<MigrationEntry['reason'], TagAccent> = {
  'anti-affinity': 'danger',
  affinity: 'success',
}

function reasonAccent(entries: MigrationEntry[]): TagAccent {
  return REASON_ACCENTS[entries[0].reason]
}

const groupedMigrations = computed(() => {
  const map = new Map<string, MigrationEntry[]>()

  for (const migration of migrations) {
    const key = `${migration.reason}:${migration.group}`

    if (!map.has(key)) {
      map.set(key, [])
    }

    map.get(key)?.push(migration)
  }

  return map
})
</script>

<style lang="postcss" scoped>
.load-balancer-migration-preview {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;

  .migration-group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .group-header {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding-block-end: 0.4rem;
    border-block-end: 0.1rem solid var(--color-neutral-border);

    .count {
      color: var(--color-neutral-txt-secondary);
    }
  }

  .migration-row {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 0.8rem;
    align-items: center;
    padding: 0.4rem 0.8rem;

    &:hover {
      background-color: var(--color-neutral-background-secondary);
      border-radius: 0.4rem;
    }
  }

  .vm {
    font-weight: 500;
  }

  .hosts {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
