<template>
  <VtsSidePanel class="vdf-group-side-panel" :has-selection="name !== undefined" @close="emit('close')">
    <template v-if="name !== undefined && group !== undefined" #actions>
      <UiLink v-if="locked" size="medium" icon="fa:globe" :to="vdfGlobalRoute('groups', { group: name })">
        {{ t('firewall:global:edit-xo-wide') }}
      </UiLink>
      <UiButton v-else size="medium" variant="tertiary" accent="brand" left-icon="action:edit" @click="emit('edit')">
        {{ t('action:edit') }}
      </UiButton>
    </template>

    <template v-if="name !== undefined && group !== undefined" #default>
      <UiPanelCard>
        <UiPanelCardTitle size="medium" :label="displayName(name)" :icon="isGlobal ? 'fa:globe' : 'fa:object-group'" />
        <div v-if="isGlobal || !isPublished" class="badges">
          <UiTag v-if="isGlobal" accent="muted" variant="primary">{{ t('firewall:global:group') }}</UiTag>
          <UiTag v-if="!isPublished" accent="warning" variant="secondary">
            {{ t('firewall:group:not-published') }}
          </UiTag>
        </div>
        <UiInfo v-if="locked" accent="info" wrap>{{ t('firewall:global:group:info') }}</UiInfo>
        <VtsCardRowKeyValue align-top>
          <template #key>{{ t('firewall:group-form:tags') }}</template>
          <template #value>
            <UiTagsList v-if="group.tags?.length">
              <VtsTag v-for="tag of group.tags" :key="tag" :value="tag" />
            </UiTagsList>
            <span v-else class="secondary">{{ t('none') }}</span>
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue align-top>
          <template #key>{{ locked ? t('firewall:global:group-ips') : t('firewall:group-form:ips') }}</template>
          <template #value>
            <ul v-if="group.ips?.length" class="ips">
              <li v-for="ip of group.ips" :key="ip">
                <code>{{ ip }}</code>
              </li>
            </ul>
            <span v-else class="secondary">{{ t('none') }}</span>
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue align-top>
          <template #key>{{ t('firewall:used-by') }}</template>
          <template #value>
            <ul v-if="usage.appliedTo.length + usage.sourceOf.length > 0" class="usage">
              <li v-for="policy of usage.appliedTo" :key="`applied:${policy}`">
                <UiLink size="small" :to="vdfPageRoute(scopeId, 'policies', { policy })">
                  {{ t('firewall:used-by:protected', { policy: displayName(policy) }) }}
                </UiLink>
              </li>
              <li v-for="policy of usage.sourceOf" :key="`source:${policy}`">
                <UiLink size="small" :to="vdfPageRoute(scopeId, 'policies', { policy })">
                  {{ t('firewall:used-by:source', { policy: displayName(policy) }) }}
                </UiLink>
              </li>
            </ul>
            <span v-else class="secondary">{{ t('firewall:used-by:none') }}</span>
          </template>
        </VtsCardRowKeyValue>
      </UiPanelCard>

      <UiPanelCard>
        <UiPanelCardTitle size="medium" :label="t('vms')" icon="object:vm" :counter="members.length">
          <template v-if="group.tags?.length" #action>
            <UiButton
              size="small"
              variant="tertiary"
              accent="brand"
              left-icon="fa:plus"
              :busy="isUpdatingTags"
              @click="emit('addVms')"
            >
              {{ t('firewall:add-vms') }}
            </UiButton>
          </template>
        </UiPanelCardTitle>
        <UiInfo v-if="group.tags?.length" accent="warning" wrap>{{ t('firewall:membership:applies-now') }}</UiInfo>
        <UiAlert v-if="tagError" accent="danger" close @close="emit('dismissError')">
          {{ t('firewall:tags:error') }}
          <template #description>{{ tagError }}</template>
        </UiAlert>
        <div v-if="unlockedInterfaces.length > 0" class="lock-all">
          <UiInfo accent="warning" wrap>
            {{ t('firewall:lock:group-unlocked', { n: unlockedInterfaces.length }) }}
          </UiInfo>
          <UiButton size="small" variant="secondary" accent="brand" left-icon="fa:lock" @click="lockAll()">
            {{ t('firewall:lock:all') }}
          </UiButton>
        </div>
        <UiInfo v-if="!group.tags?.length" accent="muted" wrap>{{ t('firewall:group-form:preview:no-tags') }}</UiInfo>
        <UiInfo v-else-if="members.length === 0" accent="muted" wrap>{{ t('firewall:group:no-member') }}</UiInfo>
        <ul v-else class="members">
          <li v-for="member of visibleMembers" :key="member.vm.id" class="member">
            <UiChip
              accent="info"
              :disabled="isUpdatingTags"
              :title="t('firewall:remove-vm:label', { vm: member.vm.name_label })"
              @remove="emit('removeVm', member.vm)"
            >
              <UiLink
                size="small"
                :icon="member.icon"
                :to="{ name: '/vm/[id]/firewall', params: { id: member.vm.id } }"
              >
                {{ member.vm.name_label }}
              </UiLink>
            </UiChip>
            <span class="details typo-body-regular-small">
              <code v-if="member.ips.length > 0" v-tooltip="member.ips.length > 1 ? member.ips.join('\n') : false">
                {{ member.ips[0] }}
                <template v-if="member.ips.length > 1">{{ t('plus-n', { n: member.ips.length - 1 }) }}</template>
              </code>
              <UiTag v-if="!member.isRunning" accent="muted" variant="primary">
                {{ t('firewall:membership:not-running') }}
              </UiTag>
              <UiInfo v-if="member.isUnlocked" v-tooltip="t('firewall:membership:unlocked')" accent="warning">
                {{ t('firewall:membership:ips-unlocked') }}
              </UiInfo>
              <span v-if="member.pool" class="secondary">
                <VtsIcon name="object:pool" size="small" />
                {{ member.pool }}
              </span>
            </span>
          </li>
        </ul>
        <UiButton
          v-if="members.length > COLLAPSED_MEMBERS"
          class="toggle"
          size="small"
          variant="tertiary"
          accent="brand"
          @click="showAll = !showAll"
        >
          {{ showAll ? t('action:show-less') : t('firewall:membership:show-all', { n: members.length }) }}
        </UiButton>
      </UiPanelCard>
    </template>
  </VtsSidePanel>
</template>

<script lang="ts" setup>
import { useVdfInterfaces } from '@/modules/vdf/composables/vdf-interfaces.composable.ts'
import { lockTarget, useVdfLock } from '@/modules/vdf/composables/vdf-lock.composable.ts'
import { useVdfVifLocks } from '@/modules/vdf/composables/vdf-vif-lock.composable.ts'
import type { VdfGroup, VdfScopeId } from '@/modules/vdf/types.ts'
import {
  displayName,
  isGlobalName,
  isGlobalScope,
  vdfGlobalRoute,
  vdfPageRoute,
} from '@/modules/vdf/utils/vdf-global.util.ts'
import { isUntrustedLock, lockProposal, reportedAddresses } from '@/modules/vdf/utils/vdf-locking.util.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'
import VtsTag from '@core/components/tag/VtsTag.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiChip from '@core/components/ui/chip/UiChip.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { objectIcon } from '@core/icons'
import { VM_POWER_STATE } from '@vates/types'
import { toLower } from 'lodash-es'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const {
  scopeId,
  name,
  group,
  members,
  poolNameOf,
  isPublished = true,
} = defineProps<{
  scopeId: VdfScopeId
  name: string | undefined
  // a global group shown in a pool: edited XO-wide
  locked?: boolean
  // global configuration: members come from several pools
  poolNameOf?: (vm: FrontXoVm) => string
  group: VdfGroup | undefined
  // false for a group only in the draft
  isPublished?: boolean
  members: FrontXoVm[]
  usage: { appliedTo: string[]; sourceOf: string[] }
  isUpdatingTags: boolean
  // why the last membership change failed
  tagError?: string
}>()

const emit = defineEmits<{
  close: []
  edit: []
  addVms: []
  removeVm: [vm: FrontXoVm]
  dismissError: []
}>()

const { t } = useI18n()

const { groupInterfaces } = useVdfInterfaces()

const COLLAPSED_MEMBERS = 5

const showAll = ref(false)

watch(
  () => name,
  () => (showAll.value = false)
)

const isGlobal = computed(() => isGlobalName(name) || isGlobalScope(scopeId))

// the interfaces the group selects (on its networks, vdf#36) whose guest
// may use any address: unlocked, or a VDF lock not enforced (vdf#41)
const untrustedOf = (vm: FrontXoVm) => groupInterfaces(vm, group).filter(iface => isUntrustedLock(iface.lock))

const memberRows = computed(() =>
  members.map(vm => {
    return {
      vm,
      icon: objectIcon('vm', toLower(vm.power_state)),
      // as agents count them, on the group's networks; IPv4 first
      ips: [...new Set(groupInterfaces(vm, group).flatMap(iface => iface.ips))].sort(
        (ipA, ipB) => Number(ipA.includes(':')) - Number(ipB.includes(':'))
      ),
      isRunning: vm.power_state === VM_POWER_STATE.RUNNING,
      isUnlocked: untrustedOf(vm).length > 0,
      pool: poolNameOf?.(vm),
    }
  })
)

const visibleMembers = computed(() => (showAll.value ? memberRows.value : memberRows.value.slice(0, COLLAPSED_MEMBERS)))

// LOCK ALL (vdf#15): the running members' unlocked interfaces, one
// confirmation listing them (a halted VM reports no address to lock to). A
// VDF lock not enforced is locked already: its host's agent is what's
// missing.
const unlockedInterfaces = computed(() =>
  members
    .filter(vm => vm.power_state === VM_POWER_STATE.RUNNING)
    .flatMap(vm =>
      untrustedOf(vm)
        .filter(iface => iface.lock === 'unlocked')
        .map(iface => ({ vm, iface }))
    )
)

const { confirmLock } = useVdfLock()

const { lockHostOf, vdfLockUnavailableFor } = useVdfVifLocks()

function lockAll() {
  if (name === undefined) {
    return
  }

  void confirmLock(
    unlockedInterfaces.value.map(({ vm, iface }) =>
      lockTarget(iface.vif, {
        vmName: vm.name_label,
        network: iface.network,
        proposal: lockProposal(reportedAddresses(iface.vif, vm.addresses), iface.vif.MAC),
        lock: iface.lock,
        vdfUnavailable: vdfLockUnavailableFor(vm),
        hostName: lockHostOf(vm)?.host.name_label,
      })
    ),
    { group: displayName(name) }
  )
}
</script>

<style lang="postcss" scoped>
.vdf-group-side-panel {
  .badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.8rem;
  }

  .ips,
  .usage {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    min-width: 0;
  }

  .ips code {
    overflow-wrap: anywhere;
  }

  .members {
    display: flex;
    flex-direction: column;
  }

  .member {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.4rem;
    padding-block: 0.8rem;
    border-block-start: 0.1rem solid var(--color-neutral-border);
    min-width: 0;

    .details {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.8rem;
      max-width: 100%;

      code {
        overflow-wrap: anywhere;
      }

      .secondary {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
      }
    }
  }

  .toggle {
    align-self: flex-start;
  }

  .lock-all {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.8rem 1.6rem;
  }

  .secondary {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
