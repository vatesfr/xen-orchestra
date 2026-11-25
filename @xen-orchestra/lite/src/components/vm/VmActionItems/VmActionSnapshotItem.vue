<template>
  <VtsActionButton
    variant="tertiary"
    accent="brand"
    :busy="areSomeVmsSnapshotting"
    :disabled="isDisabled"
    icon="fa:camera"
    @click="handleSnapshot()"
  >
    {{ t('snapshot') }}
  </VtsActionButton>
</template>

<script lang="ts" setup>
import { isVmOperationPending } from '@/libs/vm.ts'
import { VM_OPERATION } from '@/libs/xen-api/xen-api.enums.ts'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types.ts'
import { useVmStore } from '@/stores/xen-api/vm.store.ts'
import { useXenApiStore } from '@/stores/xen-api.store.ts'
import VtsActionButton from '@core/components/action-button/VtsActionButton.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  vmRefs: XenApiVm['$ref'][]
}>()

const { t } = useI18n()

const { getByOpaqueRef } = useVmStore().subscribe()

const vms = computed(() =>
  props.vmRefs.map(vmRef => getByOpaqueRef(vmRef)).filter((vm): vm is XenApiVm => vm !== undefined)
)

const areSomeVmsSnapshotting = computed(() => vms.value.some(vm => isVmOperationPending(vm, VM_OPERATION.SNAPSHOT)))

const isDisabled = computed(() => vms.value.length === 0 || areSomeVmsSnapshotting.value)

const handleSnapshot = () => {
  const vmRefsToSnapshot = Object.fromEntries(
    vms.value.map(vm => [vm.$ref, `${vm.name_label}_${new Date().toISOString()}`])
  )
  return useXenApiStore().getXapi().vm.snapshot(vmRefsToSnapshot)
}
</script>
