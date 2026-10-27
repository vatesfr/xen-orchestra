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
    <UiInfo v-if="unprotected" accent="muted" wrap>{{ t('firewall:vm:interface:unprotected') }}</UiInfo>
    <div v-else-if="policies !== undefined" class="policies typo-body-regular-small">
      <span class="secondary">{{ t('firewall:vm:interface:policies') }}</span>
      <span v-if="policies.length > 0">{{ policies.join(', ') }}</span>
      <span v-else class="secondary">{{ t('firewall:vm:interface:no-policy') }}</span>
      <span v-if="monitored.length > 0" class="secondary">
        {{ t('firewall:vm:interface:monitored', { policies: monitored.join(', ') }) }}
      </span>
    </div>
    <div class="locking">
      <UiInfo :accent="lockingAccent" wrap>{{ lockingText }}</UiInfo>
      <template v-if="lockState.lock === 'unlocked'">
        <UiButton
          size="small"
          variant="secondary"
          accent="brand"
          left-icon="fa:lock"
          @click="lock(lockProposal(reportedAddresses(vif, vm.addresses), vif.MAC))"
        >
          {{ t('firewall:lock:action') }}
        </UiButton>
        <UiLink :to="{ name: '/vm/[id]/networks', params: { id: vm.id } }" size="small">
          {{ t('firewall:vm:locking:open-network') }}
        </UiLink>
      </template>
      <!-- vdf#41: a VDF lock is removed here, XAPI's from the VM's network settings -->
      <UiButton
        v-else-if="lockState.lock === 'vdf' || lockState.lock === 'vdf-unenforced'"
        size="small"
        variant="secondary"
        accent="brand"
        left-icon="fa:lock-open"
        @click="unlock()"
      >
        {{ t('firewall:unlock:action') }}
      </UiButton>
    </div>
    <div v-if="drift" class="locking">
      <UiInfo v-tooltip="driftDetail" accent="danger" wrap>
        {{
          t(DRIFT_TEXTS[lockState.lock] ?? 'firewall:lock:drift', {
            outside: formatAddressList(drift.outside),
            allowed: shortList(drift.allowed),
          })
        }}
      </UiInfo>
      <UiButton
        size="small"
        variant="secondary"
        accent="brand"
        left-icon="fa:lock"
        @click="lock(drift.proposal, drift.allowed)"
      >
        {{
          drift.proposal.addresses.length > 0
            ? t('firewall:lock:relock-to', { addresses: shortList(drift.proposal.addresses) })
            : t('firewall:lock:relock')
        }}
      </UiButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { lockTarget, type VdfLockTarget, type VdfUnlockTarget } from '@/modules/vdf/composables/vdf-lock.composable.ts'
import { useVdfVifLocks } from '@/modules/vdf/composables/vdf-vif-lock.composable.ts'
import {
  formatAddressList,
  lockDrift,
  lockProposal,
  reportedAddresses,
  type VdfLockProposal,
  type VdfVifLock,
} from '@/modules/vdf/utils/vdf-locking.util.ts'
import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiInfo, { type InfoAccent } from '@core/components/ui/info/UiInfo.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

// One network interface of a VM, as the firewall sees it: its addresses
// (IPv4 first), and whether its IPs can be trusted (locked)
const {
  vif,
  vm,
  network,
  monitored = [],
} = defineProps<{
  vif: FrontXoVif
  vm: FrontXoVm
  network: FrontXoNetwork | undefined
  // the policies enforced on this interface (vdf#36): a group scoped to
  // networks applies to its VMs' interfaces there only
  policies?: string[]
  // the policies in monitor mode on it: they decide nothing, they record
  // what they would drop
  monitored?: string[]
  // its network is left out of the firewall (vdf:unprotected)
  unprotected?: boolean
}>()

// Lock (vdf#15): the page confirms, with the addresses the guest reports;
// unlock a VDF lock (vdf#41)
const emit = defineEmits<{
  lock: [target: VdfLockTarget]
  unlock: [target: VdfUnlockTarget]
}>()

const { t } = useI18n()

const ips = computed(() =>
  Object.entries(vm.addresses ?? {})
    .filter(([key, ip]) => key.startsWith(`${vif.device}/`) && !ip.startsWith('fe80:'))
    .map(([, ip]) => ip)
    .sort((ipA, ipB) => Number(ipA.includes(':')) - Number(ipB.includes(':')))
)

// XAPI's lock, VDF's (vdf#41: enforced only where the agent of the VM's
// host says so), none, or disabled
const { lockOf, lockHostOf, vdfLockUnavailableFor } = useVdfVifLocks()

const lockState = computed(() => lockOf(vm, vif, network))

const hostName = computed(() => lockHostOf(vm)?.host.name_label)

const LOCKING_ACCENTS: Record<VdfVifLock, InfoAccent> = {
  xapi: 'success',
  vdf: 'success',
  'vdf-unenforced': 'warning',
  unlocked: 'warning',
  disabled: 'danger',
}

const lockingAccent = computed(() => (lockState.value.prefix ? 'warning' : LOCKING_ACCENTS[lockState.value.lock]))

// who drops its traffic from the new address: nobody yet when VDF doesn't
// enforce its lock
const DRIFT_TEXTS: Partial<Record<VdfVifLock, string>> = {
  xapi: 'firewall:lock:drift',
  vdf: 'firewall:lock:drift:vdf',
  'vdf-unenforced': 'firewall:lock:drift:vdf-unenforced',
}

const lockingText = computed(() => {
  const { lock, reason, prefix } = lockState.value
  const text =
    lock === 'vdf-unenforced'
      ? t(`firewall:vm:locking:vdf-unenforced:${reason}`, { host: hostName.value ?? '?' })
      : t(`firewall:vm:locking:${lock}`)

  // a lock to a prefix lets the guest pick any address in it
  return prefix ? `${text}. ${t('firewall:vm:locking:prefix')}` : text
})

// locked, but the guest moved to another address (DHCP): XAPI (or VDF)
// drops its traffic from it until it's locked again
const drift = computed(() => lockDrift(vif, vm.addresses, network?.defaultIsLocked))

// the first address, and how many more
const shortList = (addresses: string[]) =>
  addresses.length === 0
    ? t('none')
    : `${addresses[0]}${addresses.length > 1 ? ` ${t('firewall:more', { n: addresses.length - 1 })}` : ''}`

const driftDetail = computed(() =>
  drift.value === undefined
    ? false
    : t('firewall:lock:drift:detail', {
        allowed: formatAddressList(drift.value.allowed) || t('none'),
        reported: formatAddressList(drift.value.reported),
      })
)

// proposal: what to propose; lockedTo: a relock, from what it's locked to
function lock(proposal: VdfLockProposal, lockedTo?: string[]) {
  emit(
    'lock',
    lockTarget(vif, {
      vmName: vm.name_label,
      network,
      proposal,
      lockedTo,
      lock: lockState.value.lock,
      vdfUnavailable: vdfLockUnavailableFor(vm),
      hostName: hostName.value,
    })
  )
}

function unlock() {
  emit('unlock', {
    vifId: vif.id,
    device: vif.device,
    vmName: vm.name_label,
    allowed: [...(vif.allowedIpv4Addresses ?? []), ...(vif.allowedIpv6Addresses ?? [])],
  })
}
</script>

<style lang="postcss" scoped>
.vdf-vm-interface {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;

  .head,
  .addresses,
  .policies,
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
