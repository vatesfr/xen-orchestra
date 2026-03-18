<template>
  <div class="load-balancer">
    <div class="section">
      <UiTitle>{{ t('load-balancer:current-distribution') }}</UiTitle>
      <LoadBalancerDistributionTable :hosts="poolHosts" :vms="poolVms" />
    </div>

    <UiCard class="dry-run-section">
      <UiCardTitle>{{ t('load-balancer:migration-preview') }}</UiCardTitle>
      <div class="dry-run-action">
        <UiButton
          accent="brand"
          variant="primary"
          size="medium"
          :busy="dryRunJob.isRunning.value"
          :disabled="!dryRunJob.canRun.value"
          @click="runDryRun()"
        >
          {{ t('load-balancer:dry-run') }}
        </UiButton>
      </div>
      <LoadBalancerMigrationPreview :migrations="migrations" :is-loading="dryRunJob.isRunning.value" />
    </UiCard>
  </div>
</template>

<script lang="ts" setup>
import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import LoadBalancerDistributionTable from '@/modules/pool/components/load-balancer/LoadBalancerDistributionTable.vue'
import LoadBalancerMigrationPreview from '@/modules/pool/components/load-balancer/LoadBalancerMigrationPreview.vue'
import { useXoPoolLoadBalanceDryRunJob } from '@/modules/pool/jobs/xo-pool-load-balance-dry-run.job.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { MigrationEntry } from '@/modules/pool/types/load-balancer.type.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { pool } = defineProps<{ pool: FrontXoPool }>()

const { t } = useI18n()

const { vms } = useXoVmCollection()
const { hosts } = useXoHostCollection()

const poolVms = computed(() => vms.value.filter(vm => vm.$pool === pool.id))

const poolHosts = computed(() => hosts.value.filter(host => host.$pool === pool.id))

const dryRunJob = useXoPoolLoadBalanceDryRunJob(() => pool)

const migrations = ref<MigrationEntry[]>([])

async function runDryRun() {
  const result = await dryRunJob.run()

  if (result !== undefined) {
    migrations.value = result
  }
}
</script>

<style lang="postcss" scoped>
.load-balancer {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
  margin: 0.8rem;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.dry-run-section {
  .dry-run-action {
    display: flex;
  }
}
</style>
