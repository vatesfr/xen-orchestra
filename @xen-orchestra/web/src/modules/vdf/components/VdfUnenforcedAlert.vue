<template>
  <UiAlert v-if="hosts.length > 0" accent="danger">
    {{ title }}
    <template #description>
      <p>{{ t('firewall:unenforced:info') }}</p>
      <ul class="hosts">
        <li v-for="host of hosts" :key="host.id" class="host">
          <span>{{ poolId === undefined ? `${host.poolName}: ${host.reason}` : host.reason }}</span>
          <span v-if="vmId === undefined" class="vms">
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
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

// vdf#141: hosts whose firewall agent can't enforce while VMs the firewall
// protects run there, started or moved there outside XO (or with the check
// overridden): they run unfiltered. XO-wide without props; a pool's with
// `poolId`; one host's with `hostId`, one VM's with `vmId` (and their pool's
// id). For users who may read the pool's firewall: the plugin lists only
// their pools.
const { poolId, hostId, vmId } = defineProps<{
  poolId?: string
  hostId?: string
  vmId?: string
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
    .filter(host => vmId === undefined || host.vms.some(vm => vm.id === vmId))
})

const title = computed(() => {
  if (vmId !== undefined) {
    return t('firewall:unenforced:vm', { host: hosts.value[0].name })
  }

  if (hostId !== undefined) {
    const n = hosts.value[0].vms.length

    return t('firewall:unenforced:host', { n }, n)
  }

  const n = hosts.value.length

  return t('firewall:unenforced:hosts', { n }, n)
})
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

.vms {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 0.8rem;
}
</style>
