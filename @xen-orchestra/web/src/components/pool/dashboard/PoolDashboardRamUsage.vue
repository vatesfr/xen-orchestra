<template>
  <UiCard class="pool-dashboard-ram-usage">
    <UiCardTitle>
      {{ t('ram-usage') }}
    </UiCardTitle>
    <UiCardSubtitle>
      {{ t('host') }}
      <template #info>
        {{ t('top-#', 5) }}
      </template>
    </UiCardSubtitle>
    <VtsLoadingHero v-if="!isReady" type="card" />
    <template v-else>
      <HostsRamUsage :hosts />
    </template>
    <UiCardSubtitle>
      {{ t('vms', vms.length) }}
      <template #info>
        {{ t('top-#', 5) }}
      </template>
    </UiCardSubtitle>
    <VtsLoadingHero v-if="!isReady" type="card" />
    <template v-else>
      <VmsRamUsage :vms />
    </template>
  </UiCard>
</template>

<script lang="ts" setup>
import { useHostStore } from '@/stores/xo-rest-api/host.store'
import { usePoolStore } from '@/stores/xo-rest-api/pool.store'
import { useVmStore } from '@/stores/xo-rest-api/vm.store'
import type { XoPool } from '@/types/xo/pool.type'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardSubtitle from '@core/components/ui/card-subtitle/UiCardSubtitle.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import HostsRamUsage from './ramUsage/HostsRamUsage.vue'
import VmsRamUsage from './ramUsage/VmsRamUsage.vue'

const { pool } = defineProps<{
  pool: XoPool
}>()

const { t } = useI18n()

const { isReady: isPoolReady } = usePoolStore().subscribe()
const { isReady: isHostReady } = useHostStore().subscribe()
const { vmsByHost, isReady: areVmsReady, hostLessVmsByPool } = useVmStore().subscribe()
const { hostsByPool, isReady: areHostReady } = useHostStore().subscribe()

const isReady = computed(() => isPoolReady.value && areHostReady.value && isHostReady.value && areVmsReady.value)
const hosts = computed(() => hostsByPool.value.get(pool.id) ?? [])
// no memory.usage for vm
const vms = computed(() => [
  ...hosts.value.flatMap(host => vmsByHost.value.get(host.id) ?? []),
  ...(hostLessVmsByPool.value.get(pool.id) ?? []),
])
</script>
