<template>
  <div class="load-balancer-distribution-table">
    <VtsQueryBuilder v-model="filter" :schema />

    <VtsStateHero v-if="hosts.length === 0" format="card" type="no-data" size="medium">
      {{ t('no-data') }}
    </VtsStateHero>
    <div v-else class="hosts-grid">
      <UiCard v-for="host in hosts" :key="host.id">
        <UiCardTitle>{{ host.name_label }}</UiCardTitle>
        <VtsTable :state="hostStates.get(host.id)">
          <thead>
            <HeadCells />
          </thead>
          <tbody>
            <VtsRow v-for="vm of filteredVmsByHost.get(host.id) ?? []" :key="vm.id">
              <BodyCells :item="vm" />
            </VtsRow>
          </tbody>
        </VtsTable>
      </UiCard>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { resolveLoadBalancerTagAccent } from '@/modules/vm/utils/load-balancer-tags.util.ts'
import type { TagWithAccent } from '@core/components/table/cells/VtsTagCell.vue'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { objectIcon, type IconName } from '@core/icons'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useQueryBuilderFilter } from '@core/packages/query-builder/use-query-builder-filter.ts'
import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useLinkColumn } from '@core/tables/column-definitions/link-column.ts'
import { useTagColumn } from '@core/tables/column-definitions/tag-column.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import { VM_POWER_STATE, type XoHost } from '@vates/types'
import { toLower } from 'lodash-es'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { hosts, vms } = defineProps<{
  hosts: FrontXoHost[]
  vms: FrontXoVm[]
}>()

const { t } = useI18n()

interface LoadBalancerVmDisplay {
  id: string
  name: string
  hostId: string
  power_state: string
  vmIcon: IconName
  tags: string[]
  tagsWithAccent: TagWithAccent[]
}

const allVms = computed<LoadBalancerVmDisplay[]>(() =>
  vms
    .map(vm => {
      const hasHost = vm.$container !== vm.$pool
      const hostId = hasHost ? (vm.$container as string) : ((vm.affinityHost as string | undefined) ?? '')

      return {
        id: vm.id,
        name: vm.name_label,
        hostId,
        power_state: vm.power_state,
        vmIcon: objectIcon('vm', toLower(vm.power_state)),
        tags: vm.tags,
        tagsWithAccent: vm.tags.map(resolveLoadBalancerTagAccent),
      }
    })
    .filter(vm => vm.hostId !== '')
)

const { items: filteredVms, filter } = useQueryBuilderFilter('load-balancer-vms', allVms)

const schema = useQueryBuilderSchema<LoadBalancerVmDisplay>({
  '': useStringSchema(t('any-property')),
  name: useStringSchema(t('name')),
  power_state: useStringSchema(t('power-state'), {
    [VM_POWER_STATE.RUNNING]: t('status:running'),
    [VM_POWER_STATE.HALTED]: t('status:halted'),
    [VM_POWER_STATE.SUSPENDED]: t('status:suspended'),
    [VM_POWER_STATE.PAUSED]: t('status:paused'),
  }),
  tags: useStringSchema(t('tags')),
})

const filteredVmsByHost = computed(() => {
  const map = new Map<XoHost['id'], LoadBalancerVmDisplay[]>()

  for (const host of hosts) {
    map.set(host.id, [])
  }

  for (const vm of filteredVms.value) {
    const hostVms = map.get(vm.hostId as XoHost['id'])

    if (hostVms !== undefined) {
      hostVms.push(vm)
    }
  }

  return map
})

const hostStates = computed(() => {
  const map = new Map<XoHost['id'], ReturnType<typeof useTableState>['value']>()

  for (const host of hosts) {
    const hostVms = filteredVmsByHost.value.get(host.id) ?? []
    const allHostVms = allVms.value.filter(vm => vm.hostId === host.id)

    if (allHostVms.length === 0) {
      map.set(host.id, { type: 'no-data', message: t('no-vm-detected') })
    } else if (hostVms.length === 0) {
      map.set(host.id, { type: 'no-result', message: t('no-result') })
    } else {
      map.set(host.id, undefined)
    }
  }

  return map
})

const useLoadBalancerColumns = defineColumns(() => ({
  vm: useLinkColumn({ headerLabel: () => t('vm') }),
  tags: useTagColumn({ headerLabel: () => t('tags') }),
}))

const { HeadCells, BodyCells } = useLoadBalancerColumns({
  body: (vm: LoadBalancerVmDisplay) => ({
    vm: renderer =>
      renderer({ label: vm.name, to: { name: '/vm/[id]/dashboard', params: { id: vm.id } }, icon: vm.vmIcon }),
    tags: renderer => renderer(vm.tagsWithAccent),
  }),
})
</script>

<style lang="postcss" scoped>
.load-balancer-distribution-table {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.hosts-grid {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
</style>
