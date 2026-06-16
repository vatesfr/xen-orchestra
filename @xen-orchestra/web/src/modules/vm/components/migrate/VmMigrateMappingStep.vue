<template>
  <div class="vm-migrate-mapping-step">
    <UiTitle>{{ t('storage-repositories') }}</UiTitle>
    <VmMigrateVdiMappingTable :vdis="vmVdis" :destination-srs="destinationSrs" :is-vdi-mandatory="isVdiMandatory" />
    <UiTitle>{{ t('vifs') }}</UiTitle>
    <UiAlert v-if="!isCrossPool" accent="info">
      {{ t('vm-migrate-vifs-no-config') }}
      <template #description>{{ t('vm-migrate-vifs-no-config-description') }}</template>
    </UiAlert>
    <VmMigrateVifMappingTable v-else :vifs="filteredVifs" :destination-networks="destinationNetworks" />
  </div>
</template>

<script lang="ts" setup>
import { useXoNetworkCollection } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import { useXoVifCollection } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import VmMigrateVdiMappingTable from '@/modules/vm/components/migrate/VmMigrateVdiMappingTable.vue'
import VmMigrateVifMappingTable from '@/modules/vm/components/migrate/VmMigrateVifMappingTable.vue'
import { useVmMigrateForm } from '@/modules/vm/composables/use-vm-migrate-form.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useXoVmVdisCollection } from '@/modules/vm/remote-resources/use-xo-vm-vdis-collection.ts'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const form = useVmMigrateForm()

const { t } = useI18n()

const { vmVdis } = useXoVmVdisCollection({}, () => vm.id)
const { vifs } = useXoVifCollection()
const { srs, getSrById } = useXoSrCollection()
const { networksWithPifs } = useXoNetworkCollection()

const isCrossPool = computed(() => form.poolId !== vm.$pool)

const destinationSrs = computed(() =>
  srs.value.filter(sr => sr.$pool === form.poolId && sr.content_type !== 'iso' && sr.size > 0)
)

const destinationNetworks = computed(() => networksWithPifs.value.filter(network => network.$pool === form.poolId))

const filteredVifs = computed(() => vifs.value.filter((vif: FrontXoVif) => vif.$VM === vm.id))

function isVdiMandatory(vdi: FrontXoVdi): boolean {
  if (isCrossPool.value) {
    return true
  }
  const sr = getSrById(vdi.$SR)
  if (sr === undefined) {
    return true
  }
  return !(sr.shared === true || sr.$container === form.hostId)
}

watch(
  [vmVdis, () => form.hostId] as const,
  ([, newHostId], oldValues) => {
    const hostChanged = newHostId !== oldValues?.[1]

    for (const vdi of vmVdis.value) {
      if (hostChanged || !(vdi.id in form.srIdByVdiId)) {
        form.srIdByVdiId[vdi.id] = isVdiMandatory(vdi) ? undefined : vdi.$SR
      }
    }
  },
  { immediate: true }
)

watch(
  filteredVifs,
  newVifs => {
    if (!isCrossPool.value) {
      return
    }

    for (const vif of newVifs) {
      if (!(vif.id in form.networkIdByVifId)) {
        form.networkIdByVifId[vif.id] = undefined
      }
    }
  },
  { immediate: true }
)
</script>

<style scoped lang="postcss">
.vm-migrate-mapping-step {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
}
</style>
