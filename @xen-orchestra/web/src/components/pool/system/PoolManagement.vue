<template>
  <UiCard>
    <UiTitle>
      {{ t('pool-management') }}
    </UiTitle>
    <VtsStateHero v-if="!areHostsReady" format="card" busy size="medium" />
    <template v-else>
      <UiLabelValue :label="t('master')">
        <template #value>
          <UiLink v-if="primaryHost" icon="fa:server" :to="`/host/${pool.master}/`" size="medium" class="link">
            <div v-tooltip class="text-ellipsis">
              {{ primaryHost.name_label }}
            </div>
          </UiLink>
          <template v-else>
            {{ t('none') }}
          </template>
        </template>
      </UiLabelValue>
      <UiLabelValue :label="t('auto-power')">
        <template #value>
          <VtsStatus :status="pool.auto_poweron" />
        </template>
      </UiLabelValue>
      <UiLabelValue :label="t('high-availability')">
        <template #value>
          <VtsStatus :status="pool.HA_enabled" />
        </template>
      </UiLabelValue>
      <UiLabelValue :label="t('migration-compression')">
        <template #value>
          <VtsStatus :status="pool.migrationCompression ?? false" />
        </template>
      </UiLabelValue>
    </template>
  </UiCard>
</template>

<script setup lang="ts">
import { useXoHostCollection } from '@/remote-resources/use-xo-host-collection.ts'
import type { XoPool } from '@/types/xo/pool.type'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLabelValue from '@core/components/ui/label-value/UiLabelValue.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { useI18n } from 'vue-i18n'

const { pool } = defineProps<{
  pool: XoPool
}>()

const { t } = useI18n()

const { useGetHostById, areHostsReady } = useXoHostCollection()

const primaryHost = useGetHostById(() => pool.master)
</script>

<style lang="postcss" scoped>
.link {
  width: 100%;
}
</style>
