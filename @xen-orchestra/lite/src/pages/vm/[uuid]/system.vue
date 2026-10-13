<template>
  <VtsStateHero v-if="vm === undefined" format="page" type="not-found" size="large">
    {{ t('object-not-found', { id }) }}
  </VtsStateHero>
  <VtsColumns v-else extra-space-around>
    <VtsColumn>
      <!-- POC: these two consume an XO object, the others still take the raw record -->
      <VmGeneralInfo v-if="xoVm !== undefined" :vm="xoVm" />
      <VmPocPowerActions v-if="xoVm !== undefined" :vm="xoVm" />
      <VmSystemNetworking :vm />
      <VmStorageConfig :vm />
      <VmResource :vm />
    </VtsColumn>
    <VtsColumn>
      <VmVirtualizationAndBoot :vm />
      <VmManagement :vm />
      <VmGraphics :vm />
    </VtsColumn>
  </VtsColumns>
</template>

<script lang="ts" setup>
import VmGeneralInfo from '@/components/vm/system/VmGeneralInfo.vue'
import VmGraphics from '@/components/vm/system/VmGraphics.vue'
import VmManagement from '@/components/vm/system/VmManagement.vue'
import VmPocPowerActions from '@/components/vm/system/VmPocPowerActions.vue'
import VmResource from '@/components/vm/system/VmResource.vue'
import VmStorageConfig from '@/components/vm/system/VmStorageConfig.vue'
import VmSystemNetworking from '@/components/vm/system/VmSystemNetworking.vue'
import VmVirtualizationAndBoot from '@/components/vm/system/VmVirtualizationAndBoot.vue'
import { useXoObjectGraph } from '@/composables/xo-object-graph.composable.ts'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types.ts'
import { usePageTitleStore } from '@/stores/page-title.store.ts'
import { useVmStore } from '@/stores/xen-api/vm.store.ts'
import VtsColumn from '@core/components/column/VtsColumn.vue'
import VtsColumns from '@core/components/columns/VtsColumns.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const route = useRoute<'/vm/[uuid]/system'>()
const { getByUuid } = useVmStore().subscribe()

const { t } = useI18n()

usePageTitleStore().setTitle(useI18n().t('system'))

const id = computed(() => route.params.uuid as XenApiVm['uuid'])
const vm = computed(() => getByUuid(id.value))

// POC: same VM, translated through xo-server's xapi-object-to-xo
const { getXoObject } = useXoObjectGraph()
const xoVm = computed(() => {
  if (vm.value === undefined) {
    return undefined
  }

  const xoObject = getXoObject(vm.value.$ref)

  return xoObject?.type === 'VM' ? xoObject : undefined
})
</script>
