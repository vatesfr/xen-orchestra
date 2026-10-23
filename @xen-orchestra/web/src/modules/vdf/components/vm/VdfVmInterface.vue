<template>
  <div class="vdf-vm-interface">
    <div class="head">
      <span class="typo-body-bold">{{ t('firewall:vm:interface', { device: vif.device }) }}</span>
      <span v-if="network" class="secondary typo-body-regular-small">{{ network.name_label }}</span>
    </div>
    <div class="addresses typo-body-regular-small">
      <code v-if="ips.length > 0">{{ ips[0] }}</code>
      <span
        v-if="ips.length > 1"
        v-tooltip="ips.slice(1).join('\n')"
        class="secondary"
        :aria-label="t('firewall:vm:more-ips', { n: ips.length - 1 })"
      >
        {{ t('firewall:more', { n: ips.length - 1 }) }}
      </span>
      <span v-if="ips.length === 0" class="secondary">{{ t('firewall:vm:no-ip') }}</span>
      <span class="secondary">{{ t('firewall:vm:mac', { mac: vif.MAC }) }}</span>
    </div>
    <div class="locking">
      <UiInfo :accent="lockingAccent" wrap>{{ t(`firewall:vm:locking:${lockingMode}`) }}</UiInfo>
      <UiLink v-if="lockingMode === 'unlocked'" :to="{ name: '/vm/[id]/networks', params: { id: vm.id } }" size="small">
        {{ t('firewall:vm:locking:open-network') }}
      </UiLink>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { effectiveLockingMode, type VdfLockingMode } from '@/modules/vdf/utils/vdf-status.util.ts'
import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import UiInfo, { type InfoAccent } from '@core/components/ui/info/UiInfo.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

// One network interface of a VM, as the firewall sees it: its addresses
// (IPv4 first), and whether its IPs can be trusted (locked)
const { vif, vm, network } = defineProps<{
  vif: FrontXoVif
  vm: FrontXoVm
  network: FrontXoNetwork | undefined
}>()

const { t } = useI18n()

const ips = computed(() =>
  Object.entries(vm.addresses ?? {})
    .filter(([key, ip]) => key.startsWith(`${vif.device}/`) && !ip.startsWith('fe80:'))
    .map(([, ip]) => ip)
    .sort((ipA, ipB) => Number(ipA.includes(':')) - Number(ipB.includes(':')))
)

const lockingMode = computed(() => effectiveLockingMode(vif.lockingMode, network?.defaultIsLocked))

const LOCKING_ACCENTS: Record<VdfLockingMode, InfoAccent> = {
  locked: 'success',
  unlocked: 'warning',
  disabled: 'danger',
}

const lockingAccent = computed(() => LOCKING_ACCENTS[lockingMode.value])
</script>

<style lang="postcss" scoped>
.vdf-vm-interface {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;

  .head,
  .addresses,
  .locking {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.4rem 0.8rem;
  }

  .secondary {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
