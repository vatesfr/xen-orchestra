<template>
  <UiCard>
    <UiTitle>
      {{ t('connections') }}
    </UiTitle>
    <VtsStateHero v-if="!areServersReady" format="card" type="busy" size="medium" />
    <template v-else>
      <VtsQuickInfoRow :label="t('ip-address')" :value="server?.host" />
      <VtsQuickInfoRow :label="t('proxy-url')" :value="server?.httpProxy" />
      <VtsQuickInfoRow :label="t('username')" :value="server?.username" />
      <VtsQuickInfoRow :label="t('read-only')">
        <template #value>
          <VtsStatus :status="server?.readOnly ?? false" />
        </template>
      </VtsQuickInfoRow>
      <VtsQuickInfoRow :label="t('self-signed-certificates')">
        <template #value>
          <VtsStatus :status="server?.allowUnauthorized ?? false" />
        </template>
      </VtsQuickInfoRow>
    </template>
  </UiCard>
</template>

<script setup lang="ts">
import { useXoServerCollection } from '@/remote-resources/use-xo-server-collection.ts'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import type { XoPool } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { pool } = defineProps<{ pool: XoPool }>()

const { t } = useI18n()

const { serverByPool, areServersReady } = useXoServerCollection()

const server = computed(() => serverByPool.value.get(pool.id)?.[0])
</script>
