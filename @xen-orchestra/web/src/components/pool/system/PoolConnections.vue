<template>
  <UiCard>
    <UiTitle>
      {{ t('connections') }}
    </UiTitle>
    <VtsLoadingHero v-if="!isServerCollectionReady" type="card" />
    <template v-else>
      <VtsQuickInfoRow :label="t('ip-address')" :value="server?.host" />
      <VtsQuickInfoRow :label="t('proxy-url')" :value="server?.httpProxy" />
      <VtsQuickInfoRow :label="t('username')" :value="server?.username" />
      <VtsQuickInfoRow :label="t('read-only')">
        <template #value>
          <VtsEnabledState :enabled="server?.readOnly ?? false" />
        </template>
      </VtsQuickInfoRow>
      <VtsQuickInfoRow :label="t('self-signed-certificates')">
        <template #value>
          <VtsEnabledState :enabled="server?.allowUnauthorized ?? false" />
        </template>
      </VtsQuickInfoRow>
    </template>
  </UiCard>
</template>

<script setup lang="ts">
import { useXoServerCollection } from '@/remote-resources/use-xo-server-collection.ts'
import type { XoPool } from '@/types/xo/pool.type'
import VtsEnabledState from '@core/components/enabled-state/VtsEnabledState.vue'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { pool } = defineProps<{ pool: XoPool }>()

const { t } = useI18n()

const { serverByPool, isServerCollectionReady } = useXoServerCollection()

const server = computed(() => serverByPool.value.get(pool.id)?.[0])
</script>
