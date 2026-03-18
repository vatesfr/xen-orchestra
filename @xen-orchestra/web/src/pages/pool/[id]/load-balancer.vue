<template>
  <div class="load-balancer">
    <UiTitle>{{ t('load-balancer:current-distribution') }}</UiTitle>

    <LoadBalancerDistributionTable :hosts="poolHosts" :vms="poolVms" />

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

    <LoadBalancerMigrationPreview :migrations="migrations" :is-loading="dryRunJob.isRunning.value" />
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
  gap: 0.8rem;
  margin: 0.8rem;
}
</style>
