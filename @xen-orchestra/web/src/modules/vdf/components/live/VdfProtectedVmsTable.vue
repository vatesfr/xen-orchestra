<template>
  <VtsTable
    ref="table"
    class="vdf-protected-vms-table"
    horizontal
    :state
    :pagination-bindings="vms.length > 10 ? paginationBindings : undefined"
  >
    <thead>
      <tr>
        <HeadCells />
      </tr>
    </thead>
    <tbody>
      <VtsRow v-for="vm of pageVms" :key="vm.uuid">
        <BodyCells :item="vm" />
      </VtsRow>
    </tbody>
  </VtsTable>
</template>

<script lang="ts" setup>
import { useVdfActionsColumn } from '@/modules/vdf/components/live/vdf-actions-column.ts'
import { useEndColumn } from '@/modules/vdf/components/live/vdf-end-column.ts'
import { useVdfRate } from '@/modules/vdf/components/live/vdf-rate.ts'
import { useVdfNarrow } from '@/modules/vdf/composables/vdf-narrow.composable.ts'
import { useVdfQuarantine } from '@/modules/vdf/composables/vdf-quarantine.composable.ts'
import type { VdfVmStat } from '@/modules/vdf/types.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { objectIcon } from '@core/icons'
import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useLinkColumn } from '@core/tables/column-definitions/link-column.ts'
import { useLiteralColumn } from '@core/tables/column-definitions/literal-column.ts'
import { toLower } from 'lodash-es'
import { h, useTemplateRef, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'

const { vms, vmById } = defineProps<{
  vms: VdfVmStat[]
  vmById: Map<string, FrontXoVm>
}>()

const { t, n } = useI18n()

const formatRate = useVdfRate()

const { quarantineAction } = useVdfQuarantine()

const { pageRecords: pageVms, paginationBindings } = usePagination('vdf-live-vms', () => vms, { ignoreRoute: true })

const state = useTableState({
  empty: () =>
    vms.length === 0 ? { type: 'no-data', message: t('firewall:live:no-protected-vm'), size: 'extra-small' } : false,
})

// a non-zero drop or spoofing rate: an icon, not only a color
function alarming(rate: number) {
  return rate > 0
    ? h('span', { class: 'alarming' }, [h(VtsIcon, { name: 'status:danger-circle', size: 'small' }), formatRate(rate)])
    : formatRate(rate)
}

const useVmColumns = defineColumns(() => ({
  vm: useLinkColumn({ headerLabel: () => t('vm') }),
  connections: useEndColumn({ headerLabel: () => t('firewall:live:connections') }),
  allowed: useEndColumn({ headerLabel: () => t('firewall:live:allowed-rate') }),
  dropped: useEndColumn({ headerLabel: () => t('firewall:live:dropped-rate') }),
  spoofing: useEndColumn({ headerLabel: () => t('firewall:live:spoofing') }),
  status: useLiteralColumn({ headerLabel: () => t('status') }),
  actions: useVdfActionsColumn(),
}))

const { HeadCells, BodyCells, toggle } = useVmColumns({
  body: (vm: VdfVmStat) => {
    const xoVm = vmById.get(vm.uuid)

    return {
      vm: r =>
        r({
          label: xoVm?.name_label ?? vm.name,
          icon: xoVm === undefined ? 'object:vm' : objectIcon('vm', toLower(xoVm.power_state)),
          to: { name: '/vm/[id]/firewall', params: { id: vm.uuid } },
        }),
      connections: r => r(n(vm.conns)),
      allowed: r => r(formatRate(vm.allowedPerSec)),
      dropped: r => r(alarming(vm.blockedPerSec)),
      spoofing: r => r(alarming(vm.spoofPerSec)),
      status: r =>
        r(
          h('span', { class: 'tags' }, [
            vm.quarantined ? h(UiTag, { accent: 'danger', variant: 'primary' }, () => t('firewall:quarantined')) : null,
            vm.saturated
              ? h(UiTag, { accent: 'warning', variant: 'secondary' }, () => t('firewall:live:saturated'))
              : null,
            vm.unlocked
              ? h(UiTag, { accent: 'warning', variant: 'secondary' }, () => t('firewall:membership:ips-unlocked'))
              : null,
            vm.unprotected ? h(UiTag, { accent: 'muted', variant: 'primary' }, () => t('firewall:unprotected')) : null,
          ])
        ),
      actions: r => r(xoVm === undefined ? [] : [quarantineAction(xoVm)]),
    }
  },
})

// on a laptop, no column of zeros: spoofing shows when a VM spoofs
const isNarrow = useVdfNarrow(useTemplateRef('table'), 100)

watchEffect(() => toggle('spoofing', !isNarrow.value || vms.some(vm => vm.spoofPerSec > 0)))
</script>

<style lang="postcss" scoped>
.vdf-protected-vms-table {
  :deep(.tags),
  :deep(.alarming) {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.6rem;
  }

  :deep(.alarming) {
    color: var(--color-danger-txt-base);
  }
}
</style>
