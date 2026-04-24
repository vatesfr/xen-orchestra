<template>
  <UiCard>
    <UiTitle>
      {{ t('connections') }}
    </UiTitle>
    <VtsStateHero v-if="!areServersReady" format="card" type="busy" size="medium" />
    <VtsTabularKeyValueList v-else>
      <VtsTabularKeyValueRow :label="t('ip-address')" :value="server?.host" />
      <VtsTabularKeyValueRow :label="t('proxy-url')" :value="server?.httpProxy" />
      <VtsTabularKeyValueRow :label="t('username')" :value="server?.username" />
      <VtsTabularKeyValueRow :label="t('read-only')">
        <template #value>
          <VtsStatus :status="server?.readOnly ?? false" />
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('self-signed-certificates')">
        <template #value>
          <VtsStatus :status="server?.allowUnauthorized ?? false" />
        </template>
      </VtsTabularKeyValueRow>
    </VtsTabularKeyValueList>
  </UiCard>
</template>

<script setup lang="ts">
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoServerCollection } from '@/modules/server/remote-resources/use-xo-server-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { pool } = defineProps<{ pool: FrontXoPool }>()

const { t } = useI18n()

const { serverByPool, areServersReady } = useXoServerCollection()

const server = computed(() => serverByPool.value.get(pool.id)?.[0])
</script>
