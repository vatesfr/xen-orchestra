<template>
  <UiCard>
    <UiTitle>
      {{ t('connections') }}
    </UiTitle>
    <VtsStateHero v-if="!areServersReady" format="card" busy size="medium" />
    <template v-else>
      <UiLabelValue :label="t('ip-address')" :value="server?.host" />
      <UiLabelValue :label="t('proxy-url')" :value="server?.httpProxy" />
      <UiLabelValue :label="t('username')" :value="server?.username" />
      <UiLabelValue :label="t('read-only')">
        <template #value>
          <VtsStatus :status="server?.readOnly ?? false" />
        </template>
      </UiLabelValue>
      <UiLabelValue :label="t('self-signed-certificates')">
        <template #value>
          <VtsStatus :status="server?.allowUnauthorized ?? false" />
        </template>
      </UiLabelValue>
    </template>
  </UiCard>
</template>

<script setup lang="ts">
import { useXoServerCollection } from '@/remote-resources/use-xo-server-collection.ts'
import type { XoPool } from '@/types/xo/pool.type'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLabelValue from '@core/components/ui/label-value/UiLabelValue.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { pool } = defineProps<{ pool: XoPool }>()

const { t } = useI18n()

const { serverByPool, areServersReady } = useXoServerCollection()

const server = computed(() => serverByPool.value.get(pool.id)?.[0])
</script>
