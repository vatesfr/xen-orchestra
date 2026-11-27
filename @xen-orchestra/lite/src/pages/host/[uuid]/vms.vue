<template>
  <VtsContentSidePanel class="host-vms-view">
    <UiCard class="container">
      <VmsTable :vms :busy="!isReady" :error="hasError" />
    </UiCard>
    <template #panel>
      <VmSidePanel :vm="selectedVm" @close="selectedVm = undefined" />
    </template>
  </VtsContentSidePanel>
</template>

<script lang="ts" setup>
import type { XenApiHost, XenApiVm } from '@/libs/xen-api/xen-api.types.ts'
import VmSidePanel from '@/modules/vm/components/list/panel/VmSidePanel.vue'
import VmsTable from '@/modules/vm/components/list/VmsTable.vue'
import { usePageTitleStore } from '@/stores/page-title.store.ts'
import { useHostStore } from '@/stores/xen-api/host.store.ts'
import { useVmStore } from '@/stores/xen-api/vm.store.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { logicAnd, logicOr } from '@vueuse/math'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const { t } = useI18n()

usePageTitleStore().setTitle(() => t('vms'))

const { isReady: isVmReady, hasError: hasVmError, recordsByHostRef } = useVmStore().subscribe()

const { isReady: isHostReady, hasError: hasHostError, getByUuid } = useHostStore().subscribe()

const isReady = logicAnd(isVmReady, isHostReady)

const hasError = logicOr(hasVmError, hasHostError)

const route = useRoute<'/host/[uuid]/vms'>()

const host = computed(() => getByUuid(route.params.uuid as XenApiHost['uuid']))

const vms = computed(() => (host.value ? (recordsByHostRef.value.get(host.value?.$ref) ?? []) : []))

const selectedVm = useRouteQuery<XenApiVm | undefined>('id', {
  toData: id => vms.value.find(vm => vm.uuid === id),
  toQuery: vm => vm?.uuid ?? '',
})
</script>

<style lang="postcss" scoped>
.host-vms-view {
  .container {
    height: fit-content;
    margin: 0.8rem;
    gap: 4rem;
  }
}
</style>
