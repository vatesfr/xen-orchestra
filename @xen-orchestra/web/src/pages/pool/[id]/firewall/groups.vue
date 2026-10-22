<template>
  <VtsContentSidePanel class="firewall-groups">
    <UiCard class="container">
      <VtsStateHero v-if="!isReady" format="page" type="busy" size="medium" />
      <template v-else>
        <UiTitle>
          {{ t('firewall:groups') }}
          <template #action>
            <UiButton variant="primary" accent="brand" size="medium" left-icon="fa:plus" @click="editGroup()">
              {{ t('firewall:new-group') }}
            </UiButton>
          </template>
        </UiTitle>
        <UiInfo accent="info" wrap>{{ t('firewall:groups:info') }}</UiInfo>
        <VtsTable :state sticky="right">
          <thead>
            <tr>
              <VtsHeaderCell>{{ t('firewall:group') }}</VtsHeaderCell>
              <VtsHeaderCell>{{ t('firewall:group-form:tags') }}</VtsHeaderCell>
              <VtsHeaderCell>{{ t('firewall:members') }}</VtsHeaderCell>
              <VtsHeaderCell>{{ t('firewall:used-by') }}</VtsHeaderCell>
              <VtsHeaderCell />
            </tr>
          </thead>
          <tbody>
            <VtsRow v-for="row of rows" :key="row.name" :selected="selectedGroup === row.name">
              <UiTableCell>
                <span class="name">
                  <VtsIcon name="fa:object-group" size="medium" />
                  <span class="typo-body-bold">{{ row.name }}</span>
                  <UiTag
                    v-if="row.draftState"
                    :accent="row.draftState === 'new' ? 'success' : 'info'"
                    variant="secondary"
                  >
                    {{ t(`firewall:draft-state:${row.draftState}`) }}
                  </UiTag>
                </span>
              </UiTableCell>
              <UiTableCell>
                <div class="chips">
                  <VtsTag v-for="tag of row.group.tags ?? []" :key="tag" :value="tag" />
                </div>
              </UiTableCell>
              <UiTableCell>
                <div class="chips">
                  <UiObjectLink
                    v-for="vm of row.members.slice(0, 3)"
                    :key="vm.id"
                    :route="{ name: '/vm/[id]/firewall', params: { id: vm.id } }"
                    :icon="`object:vm:${vm.power_state.toLowerCase()}` as IconName"
                  >
                    {{ vm.name_label }}
                  </UiObjectLink>
                  <code v-if="row.group.ips?.length" class="ip">{{ row.group.ips[0] }}</code>
                  <span v-if="row.hiddenCount > 0" v-tooltip="row.hidden.join('\n')" class="secondary">
                    {{ t('firewall:more', { n: row.hiddenCount }) }}
                  </span>
                  <span v-if="row.members.length === 0 && !row.group.ips?.length" class="secondary">{{
                    t('none')
                  }}</span>
                </div>
              </UiTableCell>
              <UiTableCell>
                <span v-if="row.usageCount === 0" class="secondary">{{ t('firewall:used-by:none') }}</span>
                <span v-else>{{ t('firewall:n-policies', { n: row.usageCount }) }}</span>
              </UiTableCell>
              <VtsActionCell button-icon="fa:eye" :actions="groupActions(row)" @click="selectedGroup = row.name" />
            </VtsRow>
          </tbody>
        </VtsTable>
      </template>
    </UiCard>
    <VdfGroupSidePanel
      :pool-id="pool.id"
      :name="selected?.name"
      :group="selected?.group"
      :members="selected?.members ?? []"
      :usage="selected?.usage ?? { appliedTo: [], sourceOf: [] }"
      :is-updating-tags
      @close="selectedGroup = ''"
      @edit="selected && editGroup(selected.name)"
      @add-vms="selected && addVmsToGroup(selected.name, selected.group, poolVms)"
      @remove-vm="vm => selected && removeVmFromGroup(vm, selected.group)"
    />
  </VtsContentSidePanel>
</template>

<script lang="ts" setup>
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import VdfGroupSidePanel from '@/modules/vdf/components/VdfGroupSidePanel.vue'
import { useVdfEditors } from '@/modules/vdf/composables/vdf-editors.composable.ts'
import { useVdfMembers } from '@/modules/vdf/composables/vdf-members.composable.ts'
import { useVdfMembership } from '@/modules/vdf/composables/vdf-membership.composable.ts'
import { useVdfPolicy } from '@/modules/vdf/composables/vdf-policy.composable.ts'
import { groupUsage } from '@/modules/vdf/utils/vdf-policy.util.ts'
import type { ActionItem } from '@core/components/menu/VtsActionsMenu.vue'
import type { IconName } from '@core/icons'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import VtsActionCell from '@core/components/table/cells/VtsActionCell.vue'
import VtsHeaderCell from '@core/components/table/cells/VtsHeaderCell.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable, { type TableState } from '@core/components/table/VtsTable.vue'
import VtsTag from '@core/components/tag/VtsTag.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiObjectLink from '@core/components/ui/object-link/UiObjectLink.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { logicAnd } from '@vueuse/math'
import { isEqual } from 'lodash-es'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { pool } = defineProps<{
  pool: FrontXoPool
}>()

const { t } = useI18n()

const { document, publishedDocument, isPublishedPolicyReady, deleteGroup } = useVdfPolicy(() => pool)

const { poolVms, membersOf, areVmsReady } = useVdfMembers(() => pool.id, document)

const { editGroup } = useVdfEditors(() => pool)

const { addVmsToGroup, removeVmFromGroup, isUpdatingTags } = useVdfMembership()

const isReady = logicAnd(isPublishedPolicyReady, areVmsReady)

const rows = computed(() =>
  Object.entries(document.value.groups)
    .sort(([nameA], [nameB]) => nameA.localeCompare(nameB))
    .map(([name, group]) => {
      const usage = groupUsage(document.value, name)
      const published = publishedDocument.value.groups[name]

      const members = membersOf(name)
      const hidden = [...members.slice(3).map(vm => vm.name_label), ...(group.ips ?? []).slice(1)]

      return {
        name,
        group,
        members,
        hidden,
        hiddenCount: hidden.length,
        usage,
        usageCount: new Set([...usage.appliedTo, ...usage.sourceOf]).size,
        draftState: published === undefined ? 'new' : isEqual(published, group) ? undefined : 'modified',
      }
    })
)

const state = computed<TableState | undefined>(() =>
  rows.value.length === 0 ? { type: 'no-data', message: t('firewall:no-group') } : undefined
)

const selectedGroup = useRouteQuery('group')

const selected = computed(() => rows.value.find(row => row.name === selectedGroup.value))

function groupActions(row: (typeof rows.value)[number]): ActionItem[] {
  return [
    { label: t('action:edit'), icon: 'action:edit', onClick: () => editGroup(row.name) },
    {
      label: t('firewall:add-vms'),
      icon: 'fa:plus',
      disabled: !row.group.tags?.length,
      onClick: () => addVmsToGroup(row.name, row.group, poolVms.value),
    },
    {
      label: t('firewall:delete-group'),
      icon: 'action:delete',
      accent: 'danger',
      disabled: row.usageCount > 0,
      hint: row.usageCount > 0 ? t('firewall:delete-group:in-use') : undefined,
      onClick: () => deleteGroup(row.name),
    },
  ]
}
</script>

<style lang="postcss" scoped>
.firewall-groups {
  .container {
    height: fit-content;
    gap: 2.4rem;
    margin: 0.8rem;
  }

  .name,
  .chips {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.8rem;
  }

  .secondary {
    color: var(--color-neutral-txt-secondary);
  }

  code {
    font-family: monospace;
  }

  .ip {
    max-width: 18rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
