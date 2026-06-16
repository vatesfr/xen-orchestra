<template>
  <VtsDrawer dismissible current>
    <template #title>{{ t('action:migrate-n-vms', { n: vms.length }) }}</template>

    <template #content>
      <VmMigrateGeneralStep v-if="step === 1" :vms />
      <template v-else>
        <VmMigrateMappingStep v-if="isSingleVm" :vm="singleVm" />
        <VmMigrateStrategyStep v-else />
      </template>
    </template>

    <template #buttons>
      <VtsDrawerCancelButton />
      <VtsDrawerConfirmButton v-if="step === 1" :on-click="goToStep2" :disabled="!isStep1Valid">
        {{ t('action:continue') }}
      </VtsDrawerConfirmButton>
      <VtsDrawerConfirmButton v-else :on-click="confirm" :disabled="!isStep2Valid">
        {{ t('action:migrate-n-vms', { n: vms.length }) }}
      </VtsDrawerConfirmButton>
    </template>
  </VtsDrawer>
</template>

<script lang="ts" setup>
import { useXoNetworkCollection } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import { useXoVdiCollection } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { useXoVifCollection } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import VmMigrateGeneralStep from '@/modules/vm/components/migrate/VmMigrateGeneralStep.vue'
import VmMigrateMappingStep from '@/modules/vm/components/migrate/VmMigrateMappingStep.vue'
import VmMigrateStrategyStep from '@/modules/vm/components/migrate/VmMigrateStrategyStep.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useXoVmVdisCollection } from '@/modules/vm/remote-resources/use-xo-vm-vdis-collection.ts'
import {
  IK_VM_MIGRATE_FORM,
  type VmMigrateFormState,
  type VmMigratePayload,
  type VmMigratePayloadByVmId,
} from '@/modules/vm/types/vm-migrate.type.ts'
import VtsDrawer from '@core/components/drawer/VtsDrawer.vue'
import VtsDrawerCancelButton from '@core/components/drawer/VtsDrawerCancelButton.vue'
import VtsDrawerConfirmButton from '@core/components/drawer/VtsDrawerConfirmButton.vue'
import { IK_DRAWER } from '@core/packages/drawer/types.ts'
import type { XoSr, XoVdi, XoVif } from '@vates/types'
import { computed, inject, provide, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { vms } = defineProps<{
  vms: FrontXoVm[]
  onConfirm?: (payloads: VmMigratePayloadByVmId) => void
}>()

const { t } = useI18n()

const drawer = inject(IK_DRAWER)

const { vbds } = useXoVbdCollection()
const { vifs } = useXoVifCollection()
const { networksWithPifs, getNetworkById } = useXoNetworkCollection()
const { getVdiById } = useXoVdiCollection()

const step = ref<1 | 2>(1)
const isSingleVm = computed(() => vms.length === 1)
const singleVm = computed(() => vms[0]!)

const { areVmVdisReady } = useXoVmVdisCollection({ isEnabled: isSingleVm }, () => singleVm.value.id)

const form = reactive<VmMigrateFormState>({
  poolId: vms[0]?.$pool,
  hostId: undefined,
  migrationNetworkId: undefined,
  srIdByVdiId: {},
  networkIdByVifId: {},
  vdiStrategy: 'minimum',
  selectedSrId: undefined,
})

provide(IK_VM_MIGRATE_FORM, form)

const isCrossPool = computed(() => vms.some(vm => vm.$pool !== form.poolId))

const isStep1Valid = computed(
  () => form.poolId !== undefined && form.hostId !== undefined && form.migrationNetworkId !== undefined
)

const isStep2Valid = computed(() => {
  if (!isSingleVm.value) {
    return form.selectedSrId !== undefined
  }

  if (!areVmVdisReady.value) {
    return false
  }

  const allSrsDefined = Object.values(form.srIdByVdiId).every(srId => srId !== undefined)

  if (!allSrsDefined) {
    return false
  }

  if (isCrossPool.value) {
    return Object.values(form.networkIdByVifId).every(networkId => networkId !== undefined)
  }

  return true
})

function goToStep2() {
  step.value = 2
}

function buildSingleVmPayload(): VmMigratePayload {
  const srIdByVdiId: NonNullable<VmMigratePayload['srIdByVdiId']> = {}
  for (const vdiId of Object.keys(form.srIdByVdiId) as XoVdi['id'][]) {
    const targetSrId = form.srIdByVdiId[vdiId]
    if (targetSrId === undefined) {
      continue
    }
    const vdi = getVdiById(vdiId)
    if (vdi !== undefined && targetSrId === vdi.$SR) {
      continue
    }
    srIdByVdiId[vdiId] = targetSrId
  }

  const payload: VmMigratePayload = {
    hostId: form.hostId!,
    migrationNetworkId: form.migrationNetworkId!,
  }

  if (Object.keys(srIdByVdiId).length > 0) {
    payload.srIdByVdiId = srIdByVdiId
  }

  if (isCrossPool.value) {
    const networkIdByVifId: NonNullable<VmMigratePayload['networkIdByVifId']> = {}
    for (const vifId of Object.keys(form.networkIdByVifId) as XoVif['id'][]) {
      const networkId = form.networkIdByVifId[vifId]
      if (networkId !== undefined) {
        networkIdByVifId[vifId] = networkId
      }
    }
    if (Object.keys(networkIdByVifId).length > 0) {
      payload.networkIdByVifId = networkIdByVifId
    }
  }

  return payload
}

function buildMultiVmPayload(vm: FrontXoVm): VmMigratePayload {
  const payload: VmMigratePayload = {
    hostId: form.hostId!,
    migrationNetworkId: form.migrationNetworkId!,
    srId: form.selectedSrId,
  }

  if (form.vdiStrategy === 'force') {
    const vmVbds = vbds.value.filter(vbd => vbd.VM === vm.id && !vbd.is_cd_drive && vbd.VDI !== undefined)

    if (vmVbds.length > 0) {
      const srId = form.selectedSrId!
      payload.srIdByVdiId = Object.fromEntries(vmVbds.map(vbd => [vbd.VDI as XoVdi['id'], srId])) as Record<
        XoVdi['id'],
        XoSr['id']
      >
    }
  }

  if (isCrossPool.value) {
    const destinationNetworks = networksWithPifs.value.filter(network => network.$pool === form.poolId)
    const vmVifs = vifs.value.filter(vif => vif.$VM === vm.id)

    const networkIdByVifId: NonNullable<VmMigratePayload['networkIdByVifId']> = {}
    for (const vif of vmVifs) {
      const sourceNetwork = getNetworkById(vif.$network)
      const destNetwork =
        destinationNetworks.find(network => network.name_label === sourceNetwork?.name_label) ?? destinationNetworks[0]

      if (destNetwork !== undefined) {
        networkIdByVifId[vif.id] = destNetwork.id
      }
    }

    if (Object.keys(networkIdByVifId).length > 0) {
      payload.networkIdByVifId = networkIdByVifId
    }
  }

  return payload
}

function confirm() {
  const payloads: VmMigratePayloadByVmId = Object.fromEntries(
    vms.map(vm => [vm.id, isSingleVm.value ? buildSingleVmPayload() : buildMultiVmPayload(vm)])
  )
  drawer?.value.onConfirm(payloads)
}
</script>
