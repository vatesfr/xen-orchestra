<template>
  <div class="vm-migrate-general-step">
    <UiTitle>{{ t('general-information') }}</UiTitle>
    <div class="form-grid">
      <VtsInputWrapper :label="t('pool')">
        <VtsSelect :id="poolSelectId" accent="brand" />
      </VtsInputWrapper>
      <VtsInputWrapper :label="t('destination-host')">
        <VtsSelect :id="hostSelectId" accent="brand" />
      </VtsInputWrapper>
      <VtsInputWrapper :label="t('migration-network')">
        <VtsSelect :id="networkSelectId" accent="brand" />
        <UiInfo accent="info" wrap>
          {{
            defaultMigrationNetwork !== undefined
              ? t('vm-migrate-default-network-is', { network: defaultMigrationNetwork.name_label })
              : t('vm-migrate-no-default-network')
          }}
        </UiInfo>
      </VtsInputWrapper>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoNetworkCollection } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useVmMigrateForm } from '@/modules/vm/composables/use-vm-migrate-form.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useFormSelect } from '@core/packages/form-select'
import { HOST_POWER_STATE } from '@vates/types'
import { computed, toRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { vms } = defineProps<{
  vms: FrontXoVm[]
}>()

const form = useVmMigrateForm()

const { t } = useI18n()

const { pools } = useXoPoolCollection()
const { hosts } = useXoHostCollection()
const { networksWithPifs } = useXoNetworkCollection()

const destinationPool = computed(() => pools.value.find(pool => pool.id === form.poolId))

const destinationHosts = computed(() =>
  hosts.value.filter(
    host =>
      host.$pool === form.poolId &&
      host.power_state === HOST_POWER_STATE.RUNNING &&
      !(vms.length === 1 && vms[0].$container === host.id)
  )
)

const destinationNetworks = computed(() => networksWithPifs.value.filter(network => network.$pool === form.poolId))

const defaultMigrationNetwork = computed(() => {
  const defaultId = destinationPool.value?.otherConfig['xo:migrationNetwork']
  return destinationNetworks.value.find(network => network.id === defaultId)
})

const { id: poolSelectId } = useFormSelect(pools, {
  searchable: true,
  required: true,
  model: toRef(form, 'poolId'),
  option: { label: 'name_label', value: 'id' },
})

const { id: hostSelectId } = useFormSelect(destinationHosts, {
  searchable: true,
  required: true,
  disabled: () => form.poolId === undefined,
  model: toRef(form, 'hostId'),
  option: { label: 'name_label', value: 'id' },
})

const { id: networkSelectId } = useFormSelect(destinationNetworks, {
  searchable: true,
  required: true,
  disabled: () => form.poolId === undefined,
  model: toRef(form, 'migrationNetworkId'),
  option: { label: 'name_label', value: 'id' },
})

watch(
  () => form.poolId,
  () => {
    form.hostId = undefined
    form.migrationNetworkId = defaultMigrationNetwork.value?.id
    form.srIdByVdiId = {}
    form.networkIdByVifId = {}
    form.selectedSrId = undefined
  },
  { immediate: true }
)
</script>

<style lang="postcss" scoped>
.vm-migrate-general-step {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;

  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(24rem, 1fr));
    gap: 1.6rem;
  }
}
</style>
