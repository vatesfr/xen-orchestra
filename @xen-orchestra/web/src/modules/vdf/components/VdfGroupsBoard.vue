<template>
  <VtsContentSidePanel class="vdf-groups-board">
    <div class="cards">
      <UiCard v-if="!isReady" class="container">
        <VtsStateHero v-if="hasError" format="card" type="error" size="medium">
          {{ isGlobal ? t('firewall:global:error') : t('firewall:error:unreachable') }}
        </VtsStateHero>
        <VtsStateHero v-else format="card" type="busy" size="medium" />
      </UiCard>
      <template v-else>
        <UiCard class="container">
          <UiTitle>
            {{ isGlobal ? t('firewall:groups:global-title') : t('firewall:groups:pool-title') }}
            <template #action>
              <UiButton
                variant="tertiary"
                accent="brand"
                size="medium"
                left-icon="status:info-circle"
                @click="openInfo()"
              >
                {{ t('firewall:groups:about') }}
              </UiButton>
              <UiButton variant="primary" accent="brand" size="medium" left-icon="fa:plus" @click="editGroup()">
                {{ t('firewall:new-group') }}
              </UiButton>
            </template>
          </UiTitle>
          <UiAlert v-if="tagError" accent="danger" close @close="tagError = undefined">
            {{ t('firewall:tags:error') }}
            <template #description>{{ tagError }}</template>
          </UiAlert>
          <VdfGroupsTable
            :id="isGlobal ? 'vdf-global-groups' : 'vdf-pool-groups'"
            :rows="ownRows"
            :selected="selectedGroup || undefined"
            :empty-message="isGlobal ? t('firewall:groups:global-empty') : t('firewall:groups:pool-empty')"
            :with-pools="isGlobal"
            @select="name => (selectedGroup = name)"
          />
        </UiCard>

        <UiCard v-if="globalRows.length > 0" class="container">
          <UiTitle>
            <span class="global-title">
              <VtsIcon name="fa:globe" size="medium" />
              {{ t('firewall:groups:global-title') }}
            </span>
            <template #action>
              <UiLink size="medium" icon="fa:globe" :to="vdfGlobalRoute('groups')">
                {{ t('firewall:global:edit-xo-wide') }}
              </UiLink>
            </template>
          </UiTitle>
          <UiInfo accent="info" wrap>{{ t('firewall:groups:global-in-pool') }}</UiInfo>
          <VdfGroupsTable
            id="vdf-pool-global-groups"
            :rows="globalRows"
            :selected="selectedGroup || undefined"
            :empty-message="t('firewall:groups:global-empty')"
            @select="name => (selectedGroup = name)"
          />
        </UiCard>
      </template>
    </div>
    <VdfGroupSidePanel
      :scope-id
      :locked="selected?.locked"
      :pool-name-of="isGlobal ? poolNameOf : undefined"
      :name="selected?.name"
      :group="selected?.group"
      :is-published="selected?.isPublished"
      :members="selected?.members ?? []"
      :usage="selected?.usage ?? { appliedTo: [], sourceOf: [] }"
      :is-updating-tags
      :tag-error
      @close="selectedGroup = ''"
      @edit="selected && editGroup(selected.name)"
      @add-vms="selected && addVms(selected)"
      @remove-vm="vm => selected && removeVm(vm, selected)"
      @dismiss-error="tagError = undefined"
    />
  </VtsContentSidePanel>
</template>

<script lang="ts" setup>
import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import VdfGroupsTable, { type VdfGroupRow } from '@/modules/vdf/components/groups/VdfGroupsTable.vue'
import VdfGroupSidePanel from '@/modules/vdf/components/VdfGroupSidePanel.vue'
import { useVdfEditors } from '@/modules/vdf/composables/vdf-editors.composable.ts'
import { provideVdfGroups } from '@/modules/vdf/composables/vdf-groups-context.composable.ts'
import { useVdfMembership } from '@/modules/vdf/composables/vdf-membership.composable.ts'
import { useVdfScope, type VdfScope } from '@/modules/vdf/composables/vdf-scope.composable.ts'
import type { VdfGroup } from '@/modules/vdf/types.ts'
import { displayName, isGlobalName, vdfGlobalRoute, vdfPageRoute } from '@/modules/vdf/utils/vdf-global.util.ts'
import { groupUsage } from '@/modules/vdf/utils/vdf-policy.util.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { ActionItem } from '@core/components/menu/VtsActionsMenu.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useDeleteModal } from '@core/composables/modals/use-delete-modal.ts'
import { useInfoModal } from '@core/composables/modals/use-info-modal.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { isEqual } from 'lodash-es'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

// A scope's groups: a pool's own (editable) then the global ones it holds
// (read-only), or the global configuration's, whose members come from every
// pool in scope
const { scope } = defineProps<{
  scope: VdfScope
}>()

const { t } = useI18n()

const router = useRouter()

const scopeState = useVdfScope(() => scope)

const {
  scopeId,
  isGlobal,
  document,
  publishedDocument,
  isPublishedReady,
  deleteGroup,
  isLocked,
  poolVms,
  membersOf,
  areVmsReady,
} = scopeState

const hasError = computed(() =>
  scopeState.isGlobal ? scopeState.hasGlobalError.value : scopeState.hasPublishedPolicyError.value
)

const { editGroup, editPolicy } = useVdfEditors(() => scope)

// the chips show what the groups they name are (their networks)
provideVdfGroups(() => document.value.groups)

const { addVmsToGroup, removeVmFromGroup, isUpdatingTags, tagError } = useVdfMembership()

const { pools } = useXoPoolCollection()

const poolNames = computed(() => new Map(pools.value.map(pool => [pool.id, pool.name_label])))

function poolNameOf(vm: FrontXoVm) {
  return poolNames.value.get(vm.$pool) ?? vm.$pool
}

const isReady = computed(() => isPublishedReady.value && areVmsReady.value)

const { open: openInfoModal } = useInfoModal()

function openInfo() {
  openInfoModal({
    props: {
      title: t('firewall:groups:about'),
      content: isGlobal ? t('firewall:global:groups:info') : t('firewall:groups:info'),
      icon: 'fa:object-group',
    },
  })
}

type GroupEntry = VdfGroupRow & {
  group: VdfGroup
  locked: boolean
  isPublished: boolean
  usage: { appliedTo: string[]; sourceOf: string[] }
}

const entries = computed<GroupEntry[]>(() =>
  Object.entries(document.value.groups)
    .map(([name, group]) => {
      const usage = groupUsage(document.value, name)
      const published = publishedDocument.value.groups[name]
      const locked = isLocked(name)
      const members = membersOf(name)
      const draftState = published === undefined ? 'new' : isEqual(published, group) ? undefined : 'modified'

      const entry: GroupEntry = {
        name,
        label: displayName(name),
        isGlobal: isGlobal || isGlobalName(name),
        tags: group.tags ?? [],
        ips: group.ips ?? [],
        members,
        pools: [...new Set(members.map(poolNameOf))].sort(),
        usedBy: [...new Set([...usage.appliedTo, ...usage.sourceOf])].map(displayName),
        draftState: locked ? undefined : draftState,
        actions: [],
        group,
        locked,
        isPublished: published !== undefined,
        usage,
      }

      entry.actions = groupActions(entry)

      return entry
    })
    .sort((entryA, entryB) => entryA.label.localeCompare(entryB.label))
)

// in a pool, its own groups and the global ones apart: both can be named
// `admins`
const ownRows = computed(() => entries.value.filter(entry => !entry.locked))

const globalRows = computed(() => entries.value.filter(entry => entry.locked))

const selectedGroup = useRouteQuery('group')

const selected = computed(() => entries.value.find(entry => entry.name === selectedGroup.value))

function addVms(entry: GroupEntry) {
  // a pool's draft: what its VMs will get (the global configuration's
  // document isn't a pool's)
  return addVmsToGroup(
    entry.label,
    entry.group,
    poolVms.value,
    entry.isPublished,
    isGlobal ? undefined : { name: entry.name, document: document.value }
  )
}

// membership follows what hosts enforce: the published document
function removeVm(vm: FrontXoVm, entry: GroupEntry) {
  return removeVmFromGroup(vm, entry.group, { name: entry.name, document: publishedDocument.value })
}

// DISCOVER (vdf#13): a policy in monitor mode for the group, with no rule
// and a default drop: once published, the Monitor tab lists everything its
// VMs receive, as suggested rules. The policy drawer opens prefilled, named
// after the group (the user can rename it there); saved to the draft, it's
// shown in Policies.
function discover(entry: GroupEntry) {
  const taken = new Set(document.value.policies.map(policy => policy.name))
  let name = entry.label

  for (let i = 2; taken.has(name); i++) {
    name = `${entry.label}-${i}`
  }

  return editPolicy(
    undefined,
    undefined,
    saved => router.push(vdfPageRoute(scopeId.value, 'policies', { policy: saved })),
    { name, appliedTo: entry.name, default: 'drop', mode: 'monitor', ingress: [] }
  )
}

// DELETION: in the draft only, and restorable until a publish, but a
// confirmation still avoids a slip of the menu (as for policies)
const { open: openDeleteModal } = useDeleteModal()

async function confirmDeleteGroup(entry: GroupEntry) {
  const response = await openDeleteModal({
    props: {
      subject: t('firewall:delete-group:subject', { name: entry.label }),
      description: t('firewall:delete:draft-info'),
      confirmLabel: t('firewall:delete-group'),
    },
  })

  if (response.event === 'onConfirm') {
    deleteGroup(entry.name)
  }
}

function groupActions(entry: GroupEntry): ActionItem[] {
  // membership is live in every scope (VM tags); a global group's
  // definition is edited in the global firewall
  const addVmsAction: ActionItem = {
    label: t('firewall:add-vms'),
    icon: 'fa:plus',
    disabled: entry.tags.length === 0,
    hint: entry.tags.length === 0 ? t('firewall:group:no-tags:short') : t('firewall:membership:applies-now:short'),
    // not awaited: the menu closes as the modal opens, rather than staying
    // open behind it until the modal is answered
    onClick: () => {
      void addVms(entry)
    },
  }

  if (entry.locked) {
    return [addVmsAction]
  }

  return [
    { label: t('action:edit'), icon: 'action:edit', onClick: () => editGroup(entry.name) },
    addVmsAction,
    {
      label: t('firewall:discover'),
      icon: 'fa:eye',
      disabled: entry.tags.length === 0,
      hint: entry.tags.length === 0 ? t('firewall:group:no-tags:short') : t('firewall:discover:hint:short'),
      onClick: () => {
        void discover(entry)
      },
    },
    {
      label: t('firewall:delete-group'),
      icon: 'action:delete',
      accent: 'danger',
      disabled: entry.usedBy.length > 0,
      hint:
        entry.usedBy.length > 0
          ? t('firewall:delete-group:used-by:short', { policies: entry.usedBy.join(', ') })
          : undefined,
      onClick: () => {
        void confirmDeleteGroup(entry)
      },
    },
  ]
}
</script>

<style lang="postcss" scoped>
.vdf-groups-board {
  .cards {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    margin: 0.8rem;
  }

  .container {
    height: fit-content;
    gap: 2.4rem;

    /* beside the side panel, on a laptop: the actions go under the title */
    :deep(.ui-title) {
      flex-wrap: wrap;
      row-gap: 0.8rem;
    }
  }

  .global-title {
    display: inline-flex;
    align-items: center;
    gap: 0.8rem;
  }
}
</style>
