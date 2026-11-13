<template>
  <UiAlert v-if="hosts.length > 0" accent="danger">
    {{ title }}
    <template #description>
      <ul class="hosts">
        <li v-for="host of hosts" :key="host.id" class="host">
          <span>{{ hostText(host) }}</span>
          <span v-if="host.since !== undefined" class="secondary">
            {{ t('firewall:unenforced:since', { date: formatDateTime(host.since) }) }}
          </span>
          <span v-if="hostId === undefined" class="vms">
            <UiLink
              v-for="vm of host.vms"
              :key="vm.id"
              :to="{ name: '/vm/[id]/firewall', params: { id: vm.id } }"
              size="small"
            >
              {{ vm.name }}
            </UiLink>
          </span>
        </li>
      </ul>
    </template>
  </UiAlert>
</template>

<script lang="ts" setup>
import { useVdfAvailability } from '@/modules/vdf/composables/vdf-availability.composable.ts'
import { useVdfFirewallRights } from '@/modules/vdf/composables/vdf-rights.composable.ts'
import { useVdfUnenforced } from '@/modules/vdf/remote-resources/use-vdf-unenforced.ts'
import type { VdfUnenforcedHost } from '@/modules/vdf/types.ts'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { formatDateTime } from '@core/utils/time.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

// vdf#141: hosts without a working firewall agent while VMs the firewall
// protects run there, for the pages that say it nowhere else (the pool and
// XO-wide overviews list exposed VMs, the VM's Firewall tab says Exposed).
// XO-wide without props; a pool's with `poolId`; one host's with `hostId`
// (and its pool's id). A missing agent filters nothing; a stopped or stuck
// one leaves the flows it installed, and enforces nothing that came since.
// For users who may read the pool's firewall: the plugin lists only their
// pools.
const { poolId, hostId } = defineProps<{
  poolId?: string
  hostId?: string
}>()

const { t } = useI18n()

const { isVdfEnabled } = useVdfAvailability()

const { can } = useVdfFirewallRights(() => poolId)

const { unenforced } = useVdfUnenforced({ isEnabled: isVdfEnabled })

const hosts = computed(() => {
  if (!isVdfEnabled.value || (poolId !== undefined && !can('read'))) {
    return []
  }

  return (unenforced.value?.pools ?? [])
    .filter(pool => poolId === undefined || pool.id === poolId)
    .flatMap(pool => pool.hosts.map(host => ({ ...host, poolName: pool.name })))
    .filter(host => hostId === undefined || host.id === hostId)
})

const title = computed(() => {
  const n = hosts.value.reduce((count, host) => count + host.vms.length, 0)

  return t(hostId === undefined ? 'firewall:unenforced:vms' : 'firewall:unenforced:host', { n }, n)
})

// missing: nothing filtered; stopped or stale: its flows stay, nothing since
function hostText(host: VdfUnenforcedHost & { poolName: string }) {
  const n = host.vms.length
  const name = poolId === undefined ? `${host.name} (${host.poolName})` : host.name

  return t(`firewall:unenforced:${host.state === 'missing' ? 'missing' : 'stale'}`, { host: name, n }, n)
}
</script>

<style lang="postcss" scoped>
.hosts {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-block-start: 0.4rem;
}

.host {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem 1.6rem;
}

.secondary {
  color: var(--color-neutral-txt-secondary);
}

.vms {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 0.8rem;
}
</style>
