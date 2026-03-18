<template>
  <UiCard class="load-balancer-migration-plan">
    <div class="header">
      <UiCardTitle>{{ t('load-balancer:migration-plan') }}</UiCardTitle>
      <UiButton variant="secondary" accent="brand" size="small" :busy="loading" @click="runDryRun()">
        {{ t('load-balancer:dry-run') }}
      </UiButton>
    </div>
    <VtsStateHero v-if="!ready" format="card" type="busy" size="medium" />
    <template v-else-if="migrationPlan === undefined">
      <VtsStateHero format="card" type="no-data" size="extra-small" horizontal>
        {{ t('load-balancer:click-dry-run') }}
      </VtsStateHero>
    </template>
    <template v-else-if="migrationEntries.length === 0">
      <div class="result-banner success">
        <VtsIcon name="fa:check" size="medium" />
        <span class="typo-body-semi-bold">{{ t('load-balancer:no-migrations-needed') }}</span>
      </div>
    </template>
    <template v-else>
      <div class="result-banner warning">
        <VtsIcon name="fa:repeat" size="medium" />
        <span class="typo-body-semi-bold">{{ t('load-balancer:n-migrations', migrationEntries.length) }}</span>
      </div>
      <div class="list">
        <LoadBalancerMigrationItem
          v-for="[vmId, targetHostId] of migrationEntries"
          :key="vmId"
          :vm="vmMap.get(vmId)"
          :target-host-id="targetHostId"
          :hosts
        />
      </div>
    </template>
  </UiCard>
</template>

<script lang="ts" setup>
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import LoadBalancerMigrationItem from '@/modules/load-balancer/components/LoadBalancerMigrationItem.vue'
import { mockLoadBalance } from '@/modules/load-balancer/mock/mock-load-balance.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import type { XoHost, XoVm } from '@vates/types'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { vms, hosts } = defineProps<{
  vms: FrontXoVm[]
  hosts: FrontXoHost[]
  ready: boolean
}>()

const { t } = useI18n()

const migrationPlan = ref<Record<XoVm['id'], XoHost['id']>>()
const loading = ref(false)

const vmMap = computed(() => {
  const map = new Map<XoVm['id'], FrontXoVm>()

  for (const vm of vms) {
    map.set(vm.id, vm)
  }

  return map
})

const migrationEntries = computed(() => {
  if (migrationPlan.value === undefined) {
    return []
  }

  return Object.entries(migrationPlan.value) as [XoVm['id'], XoHost['id']][]
})

async function runDryRun() {
  loading.value = true

  // Simulate async call — in production this would be:
  // fetchPost<Record<XoVm['id'], XoHost['id']>>(`pools/${poolId}/actions/load-balance`, { plan, dryRun: true })
  await new Promise(resolve => setTimeout(resolve, 500))

  migrationPlan.value = mockLoadBalance(vms, hosts)
  loading.value = false
}
</script>

<style lang="postcss" scoped>
.load-balancer-migration-plan {
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .result-banner {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 1.2rem 1.6rem;
    border-radius: 0.4rem;

    &.success {
      background-color: var(--color-success-background-selected);
      color: var(--color-success-txt-base);
    }

    &.warning {
      background-color: var(--color-warning-background-selected);
      color: var(--color-warning-txt-base);
    }
  }

  .list {
    display: flex;
    flex-direction: column;
  }
}
</style>
