<template>
  <VdfGate :pool-id="vm.$pool">
    <VtsStateHero
      v-if="pool !== undefined && !isPublishedPolicyReady && hasPublishedPolicyError"
      format="page"
      type="error"
      size="medium"
      class="vm-firewall-state"
    >
      {{ t('firewall:error:unreachable') }}
    </VtsStateHero>
    <VtsStateHero
      v-else-if="pool === undefined || !isPublishedPolicyReady || !areHostsReady"
      format="page"
      type="busy"
      size="medium"
      class="vm-firewall-state"
    />
    <div v-else class="vm-firewall">
      <div class="status">
        <UiAlert :accent="statusAccent" class="status-alert">
          <span class="status-title">
            <span class="typo-body-bold">{{ t(`firewall:vm:status:${protection}`) }}</span>
            <UiTag
              v-if="untrustedMembers.length > 0"
              v-tooltip="t('firewall:untrusted:info', { vms: formatList(untrustedMembers) })"
              accent="warning"
              variant="secondary"
              tabindex="0"
            >
              {{ t('firewall:untrusted') }}
            </UiTag>
            <UiTag
              v-if="vmShadows.length > 0"
              v-tooltip="bypassedInfo"
              accent="danger"
              variant="secondary"
              tabindex="0"
            >
              {{ t('firewall:vm:bypassed') }}
            </UiTag>
          </span>
          <template #description>{{ statusDetail }}</template>
        </UiAlert>
        <div class="status-actions">
          <VdfPreviewBadge />
          <UiButton
            v-if="isQuarantined"
            variant="primary"
            accent="brand"
            size="medium"
            left-icon="fa:lock-open"
            :busy="isUpdatingTags"
            @click="confirmQuarantine(vm, false)"
          >
            {{ t('firewall:vm:release') }}
          </UiButton>
          <MenuList v-else placement="bottom-end">
            <template #trigger="{ open }">
              <UiButtonIcon
                v-tooltip="t('more-actions')"
                icon="action:more-actions"
                accent="brand"
                size="medium"
                :aria-label="t('more-actions')"
                @click="open($event)"
              />
            </template>
            <MenuItem accent="danger" icon="fa:lock" :busy="isUpdatingTags" @click="confirmQuarantine(vm, true)">
              {{ t('firewall:vm:quarantine-action') }}
            </MenuItem>
          </MenuList>
        </div>
      </div>

      <UiAlert v-if="tagError" accent="danger">
        {{ t('firewall:vm:tags-failed', { vm: vm.name_label }) }}
        <template #description>{{ tagError }}</template>
      </UiAlert>

      <VdfDraftHint v-if="hasDraft" :to="{ name: '/pool/[id]/firewall/policies', params: { id: pool.id } }" />

      <VtsColumns>
        <VtsColumn>
          <UiCard>
            <UiTitle>
              {{ t('firewall:vm:effective') }}
              <template #action>
                <UiLink :to="{ name: '/pool/[id]/firewall/policies', params: { id: pool.id } }" size="medium">
                  {{ t('firewall:manage-policies') }}
                </UiLink>
              </template>
            </UiTitle>
            <VdfEffectivePolicy
              :pool-id="pool.id"
              :document="publishedDocument"
              :vm-tags="vm.tags"
              :quarantined="protection === 'quarantined'"
              :shadow-notes
            />
          </UiCard>
        </VtsColumn>

        <VtsColumn>
          <UiCard>
            <UiTitle>{{ t('firewall:groups') }}</UiTitle>
            <UiTagsList v-if="vmGroups.length > 0">
              <UiChip
                v-for="group of vmGroups"
                :key="group.name"
                v-tooltip="t('firewall:vm:leave', { group: group.label })"
                accent="info"
                :disabled="isUpdatingTags"
                @remove="leaveGroup(group.name)"
              >
                <span class="chip">
                  <VtsIcon :name="group.isGlobal ? 'fa:globe' : 'fa:object-group'" size="small" />
                  {{ group.label }}
                </span>
              </UiChip>
            </UiTagsList>
            <span v-else class="secondary typo-body-regular-small">{{ t('firewall:vm:no-group') }}</span>
            <VtsInputWrapper v-if="joinableGroups.length > 0" :label="t('firewall:vm:join-group')">
              <VtsSelect :id="joinSelectId" accent="brand" />
            </VtsInputWrapper>
            <span class="secondary typo-body-regular-small">{{ t('firewall:vm:groups:info') }}</span>
          </UiCard>

          <UiCard>
            <UiTitle>{{ t('firewall:vm:interfaces') }}</UiTitle>
            <VtsStateHero v-if="vmVifs.length === 0" format="card" type="no-data" size="extra-small" horizontal>
              {{ t('firewall:vm:no-interface') }}
            </VtsStateHero>
            <VdfVmInterface
              v-for="vif of vmVifs"
              :key="vif.id"
              :vif
              :vm
              :network="getNetworkById(vif.$network)"
              :policies="interfacePolicies(vif)"
              :monitored="interfacePolicies(vif, true)"
              :unprotected="getNetworkById(vif.$network)?.tags.includes(VDF_UNPROTECTED_TAG)"
              class="interface"
              @lock="target => confirmLock([target])"
              @unlock="target => confirmUnlock(target)"
            />
          </UiCard>

          <UiCard>
            <UiTitle>{{ t('firewall:vm:test') }}</UiTitle>
            <div v-if="isRunning" class="links">
              <UiLink
                :to="{ name: '/pool/[id]/firewall/trace', params: { id: pool.id }, query: { to: vm.id } }"
                size="medium"
                icon="fa:route"
              >
                {{ t('firewall:vm:test:to') }}
              </UiLink>
              <UiLink
                :to="{ name: '/pool/[id]/firewall/trace', params: { id: pool.id }, query: { from: vm.id } }"
                size="medium"
                icon="fa:route"
              >
                {{ t('firewall:vm:test:from') }}
              </UiLink>
              <UiLink
                :to="{ name: '/pool/[id]/firewall/live', params: { id: pool.id }, query: { vm: vm.id } }"
                size="medium"
                icon="fa:network-wired"
              >
                {{ t('firewall:vm:live') }}
              </UiLink>
            </div>
            <span v-else class="secondary typo-body-regular-small">{{ t('firewall:vm:test:not-running') }}</span>
          </UiCard>
        </VtsColumn>
      </VtsColumns>

      <!-- vdf#40: XO's Traffic Rules decide before VDF for what they match -->
      <UiCard v-if="isGuarded && vmTrafficRules.length > 0">
        <UiTitle>{{ t('firewall:traffic-rules') }}</UiTitle>
        <p class="secondary typo-body-regular-small">{{ t('firewall:traffic-rules:info') }}</p>
        <div v-for="(item, index) of vmTrafficRules" :key="index" class="traffic-rule typo-body-regular-small">
          <span>{{ ruleText(item) }}</span>
          <UiTag
            v-tooltip="t(`firewall:traffic-rule:status:${statusOf(item, shadowed)}:info`)"
            :accent="TRAFFIC_RULE_ACCENTS[statusOf(item, shadowed)]"
            variant="secondary"
            tabindex="0"
          >
            {{ t(`firewall:traffic-rule:status:${statusOf(item, shadowed)}`) }}
          </UiTag>
        </div>
        <UiLink :to="{ name: '/pool/[id]/traffic-rules', params: { id: pool.id } }" size="small">
          {{ t('firewall:traffic-rules:open') }}
        </UiLink>
      </UiCard>

      <!-- full width: a table of eight columns -->
      <UiCard>
        <UiTitle>{{ t('firewall:vm:log') }}</UiTitle>
        <VdfRuleLogTable :pool-id="pool.id" :vm-name="vm.name_label" />
      </UiCard>
    </div>
  </VdfGate>
</template>

<script lang="ts" setup>
import { useXoNetworkCollection } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import VdfDraftHint from '@/modules/vdf/components/overview/VdfDraftHint.vue'
import VdfEffectivePolicy from '@/modules/vdf/components/VdfEffectivePolicy.vue'
import VdfGate from '@/modules/vdf/components/VdfGate.vue'
import VdfPreviewBadge from '@/modules/vdf/components/VdfPreviewBadge.vue'
import VdfRuleLogTable from '@/modules/vdf/components/VdfRuleLogTable.vue'
import VdfVmInterface from '@/modules/vdf/components/vm/VdfVmInterface.vue'
import { provideVdfGroups } from '@/modules/vdf/composables/vdf-groups-context.composable.ts'
import { useVdfLock, useVdfUnlock } from '@/modules/vdf/composables/vdf-lock.composable.ts'
import { useVdfMembership } from '@/modules/vdf/composables/vdf-membership.composable.ts'
import { useVdfMonitorShadows } from '@/modules/vdf/composables/vdf-monitor-shadows.composable.ts'
import { useVdfPolicy } from '@/modules/vdf/composables/vdf-policy.composable.ts'
import { isVmQuarantined, useVdfQuarantine } from '@/modules/vdf/composables/vdf-quarantine.composable.ts'
import { useVdfTrafficRules } from '@/modules/vdf/composables/vdf-traffic-rules.composable.ts'
import { useVdfUntrustedMembers } from '@/modules/vdf/composables/vdf-untrusted.composable.ts'
import { displayName, isGlobalName } from '@/modules/vdf/utils/vdf-global.util.ts'
import { isMonitored } from '@/modules/vdf/utils/vdf-monitor.util.ts'
import { groupNetworks, isOnNetworks, VDF_UNPROTECTED_TAG } from '@/modules/vdf/utils/vdf-networks.util.ts'
import { effectiveTiers, groupUsage, vmGroupNames } from '@/modules/vdf/utils/vdf-policy.util.ts'
import { vmProtection, type VdfVmProtection } from '@/modules/vdf/utils/vdf-status.util.ts'
import { shadowedVifs, type VdfTrafficRuleStatus } from '@/modules/vdf/utils/vdf-traffic-rules.util.ts'
import { type FrontXoVif, useXoVifCollection } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsColumn from '@core/components/column/VtsColumn.vue'
import VtsColumns from '@core/components/columns/VtsColumns.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiChip from '@core/components/ui/chip/UiChip.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useFormSelect } from '@core/packages/form-select'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { VM_POWER_STATE } from '@vates/types'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const { t, te, locale } = useI18n()

const { useGetPoolById } = useXoPoolCollection()

const pool = useGetPoolById(() => vm.$pool)

// what the hosts enforce for this VM: the published document, never the
// draft (the page only renders once the pool is known)
const { publishedDocument, isPublishedPolicyReady, hasPublishedPolicyError, hasDraft, hosts, hostOf, areHostsReady } =
  useVdfPolicy(() => pool.value!)

const membership = useVdfMembership()

const { setTags, removeVmFromGroup, isUpdatingTags, tagError } = membership

const { vifs } = useXoVifCollection()

const { getNetworkById } = useXoNetworkCollection()

const isQuarantined = computed(() => isVmQuarantined(vm))

const isRunning = computed(() => vm.power_state === VM_POWER_STATE.RUNNING)

const appliedPolicies = computed(() => effectiveTiers(vm.tags, publishedDocument.value).flatMap(tier => tier.policies))

// enforced: what protects it; monitored: what records what it would drop
const policyNames = computed(() =>
  appliedPolicies.value.filter(policy => !isMonitored(policy)).map(policy => displayName(policy.name))
)

const monitoredNames = computed(() => appliedPolicies.value.filter(isMonitored).map(policy => displayName(policy.name)))

// monitored policies an enforced one decides first for on this VM (vdf#86):
// their report stays empty for it
const { shadowsIn, shadowText } = useVdfMonitorShadows()

const shadowNotes = computed(() => {
  const notes: Record<string, string[]> = {}

  for (const shadow of shadowsIn(publishedDocument.value, [{ vm }])) {
    notes[shadow.policy] = [...(notes[shadow.policy] ?? []), shadowText(shadow)]
  }

  return notes
})

// enforcement happens on the host the VM runs on only (#37)
const host = computed(() => (isRunning.value ? hostOf(vm) : undefined))

const protection = computed(() =>
  vmProtection({
    quarantined: isQuarantined.value,
    running: isRunning.value,
    policyCount: policyNames.value.length,
    monitoredCount: monitoredNames.value.length,
    hostState: host.value?.state ?? 'unknown',
  })
)

const STATUS_ACCENTS: Record<VdfVmProtection, 'success' | 'info' | 'warning' | 'danger'> = {
  protected: 'success',
  outdated: 'warning',
  exposed: 'danger',
  'protected-when-running': 'info',
  monitored: 'info',
  unprotected: 'warning',
  quarantined: 'danger',
  'quarantine-not-enforced': 'danger',
}

const statusAccent = computed(() => STATUS_ACCENTS[protection.value])

const formatList = (items: string[]) => new Intl.ListFormat(locale.value, { type: 'conjunction' }).format(items)

const statusDetail = computed(() => {
  const names = protection.value === 'monitored' ? monitoredNames.value : policyNames.value
  const params = {
    n: names.length,
    policies: formatList(names),
    host: host.value?.host.name_label ?? vm.$container,
  }

  // the host can't enforce what applies: say why, and what to do there
  if (
    protection.value === 'exposed' ||
    protection.value === 'outdated' ||
    protection.value === 'quarantine-not-enforced'
  ) {
    const state = host.value?.state ?? 'unknown'
    const hint = te(`firewall:host-state:${state}:hint`) ? `. ${t(`firewall:host-state:${state}:hint`)}` : '.'

    // a stale agent's flows stay: only what changed since it stopped isn't enforced
    const key = `firewall:vm:status:${protection.value}:detail${state === 'stale' && protection.value !== 'outdated' ? ':stale' : ''}`

    return `${t(key, params)} ${t(`firewall:host-state:${state}`)}${hint}`
  }

  return t(`firewall:vm:status:${protection.value}:detail`, params)
})

// UNTRUSTED MEMBERS (vdf#41): the VM, or the peers its enforced policies
// allow or drop, with addresses their guests choose (an interface not
// locked, one XAPI can't lock while an SDN controller is registered, or a
// VDF lock its host's agent doesn't enforce)

const { untrustedInPolicy, isVmUntrusted } = useVdfUntrustedMembers(() => vm.$pool, publishedDocument)

const untrustedMembers = computed(() => {
  if (protection.value !== 'protected' && protection.value !== 'outdated' && protection.value !== 'exposed') {
    return []
  }

  const peers = appliedPolicies.value
    .filter(policy => !isMonitored(policy))
    .flatMap(policy => untrustedInPolicy(policy, { peersOnly: true }))

  return [...new Set([...(isVmUntrusted(vm) ? [vm.name_label] : []), ...peers])].sort((a, b) => a.localeCompare(b))
})

// TRAFFIC RULES (vdf#40): XO's SDN controller writes them in table 0 above
// VDF's flows, so for what they match they decide first; the hosts' agents
// report the guarded VIFs they shadow

const { rulesOfVm, ruleText, statusOf } = useVdfTrafficRules()

const vmTrafficRules = computed(() => rulesOfVm(vm))

const shadowed = computed(() => shadowedVifs(hosts.value))

const vmShadows = computed(() => [...shadowed.value.values()].filter(shadow => shadow.vm === vm.id))

// VDF decides for its interfaces (it protects or quarantines it)
const isGuarded = computed(() => protection.value !== 'unprotected' && protection.value !== 'monitored')

const bypassedInfo = computed(() =>
  t('firewall:vm:bypassed:info', {
    allows: vmShadows.value.reduce((sum, shadow) => sum + shadow.allows, 0),
    drops: vmShadows.value.reduce((sum, shadow) => sum + shadow.drops, 0),
    sample: vmShadows.value[0]?.sample ?? '',
  })
)

const TRAFFIC_RULE_ACCENTS: Record<VdfTrafficRuleStatus, 'danger' | 'warning' | 'muted'> = {
  bypasses: 'danger',
  'decides-first': 'warning',
  'not-applied': 'muted',
}

// GROUPS: membership is tags, written at once (no draft), after a
// confirmation that says what changes

// the pool's own groups first, then the global ones ("app · global": a
// global group can share its name with the pool's own)
const vmGroups = computed(() =>
  vmGroupNames(vm.tags, publishedDocument.value)
    .map(name => ({
      name,
      label: isGlobalName(name) ? t('firewall:global-name', { name: displayName(name) }) : name,
      isGlobal: isGlobalName(name),
    }))
    .sort(
      (groupA, groupB) => Number(groupA.isGlobal) - Number(groupB.isGlobal) || groupA.label.localeCompare(groupB.label)
    )
)

// published groups only: hosts don't know the draft's
const joinableGroups = computed(() =>
  Object.entries(publishedDocument.value.groups)
    .filter(([name, group]) => (group.tags ?? []).length > 0 && !vmGroups.value.some(vmGroup => vmGroup.name === name))
    .map(([name, group]) => ({
      name,
      // a global group and the pool's own can share a name: "app (global)"
      label: t('firewall:vm:group-option', {
        group: isGlobalName(name) ? t('firewall:global-name', { name: displayName(name) }) : name,
        tags: formatList(group.tags ?? []),
      }),
    }))
    .sort(
      (groupA, groupB) =>
        Number(isGlobalName(groupA.name)) - Number(isGlobalName(groupB.name)) ||
        groupA.label.localeCompare(groupB.label)
    )
)

const groupToJoin = ref('')

const { id: joinSelectId } = useFormSelect(joinableGroups, {
  model: groupToJoin,
  placeholder: t('firewall:vm:join-group:placeholder'),
  searchable: true,
  disabled: isUpdatingTags,
  option: { id: 'name', value: 'name', label: 'label' },
})

const { open: openJoin } = useOverlay({
  component: () => import('@/modules/vdf/components/vm/VdfJoinGroupModal.vue'),
  events: { onConfirm: true, onCancel: true },
})

async function joinGroup(name: string) {
  const group = publishedDocument.value.groups[name]

  if (group === undefined) {
    return
  }

  const response = await openJoin({
    props: {
      vmName: vm.name_label,
      groupName: displayName(name),
      tags: group.tags ?? [],
      protectedBy: groupUsage(publishedDocument.value, name).appliedTo.map(displayName),
      // vdf#40: they keep deciding first once the VM is protected
      trafficRules: vmTrafficRules.value.length,
      monitorBlind: shadowsIn(publishedDocument.value, [
        { vm, tags: [...new Set([...vm.tags, ...(group.tags ?? [])])] },
      ])
        .filter(shadow => publishedDocument.value.policies.some(p => p.name === shadow.policy && p.appliedTo === name))
        .map(shadowText),
    },
  })

  if (response.event === 'onConfirm') {
    try {
      await setTags([vm], group.tags ?? [], true)
    } catch {
      // shown through tagError
    }
  }
}

// picking a group asks to join it, and the select goes back to its
// placeholder whatever the answer
watch(groupToJoin, async name => {
  if (name === '') {
    return
  }

  await joinGroup(name)
  groupToJoin.value = ''
})

function leaveGroup(name: string) {
  const group = publishedDocument.value.groups[name]

  if (group !== undefined) {
    return removeVmFromGroup(vm, group, { name, document: publishedDocument.value })
  }
}

// INTERFACES

// the enforced policies on an interface (or those in monitor mode): those
// whose group has no networks, or one its network carries (vdf#36)
function interfacePolicies(vif: FrontXoVif, monitored = false) {
  const netTags = getNetworkById(vif.$network)?.tags ?? []

  return appliedPolicies.value
    .filter(
      policy =>
        isMonitored(policy) === monitored &&
        isOnNetworks(netTags, groupNetworks(publishedDocument.value.groups[policy.appliedTo]))
    )
    .map(policy => displayName(policy.name))
}

// the chips show what the groups they name are (their networks)
provideVdfGroups(() => publishedDocument.value.groups)

const vmVifs = computed(() =>
  vifs.value.filter(vif => vif.$VM === vm.id).sort((vifA, vifB) => Number(vifA.device) - Number(vifB.device))
)

// QUARANTINE: the same confirmation as the VM's header menu and the Live
// tables; a failure shows through tagError

const { confirmQuarantine } = useVdfQuarantine(membership)

// LOCKING: an interface locked to the addresses its guest reports, after
// a confirmation (vdf#15); with VDF where XAPI refuses, and unlocked from
// here then (vdf#41)

const { confirmLock } = useVdfLock()

const { confirmUnlock } = useVdfUnlock()
</script>

<style lang="postcss" scoped>
.vm-firewall-state {
  margin: 0.8rem;
}

.vm-firewall {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin: 0.8rem;

  .traffic-rule {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem 0.8rem;
  }

  .status-title {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem 0.8rem;
  }

  .status {
    display: flex;
    align-items: center;
    gap: 1.6rem;
  }

  .status-alert {
    flex: 1;
  }

  .status-actions {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }

  .links {
    display: flex;
    flex-wrap: wrap;
    gap: 0.8rem 1.6rem;
  }

  .interface + .interface {
    padding-block-start: 1.6rem;
    border-block-start: 0.1rem solid var(--color-neutral-border);
  }

  .secondary {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
