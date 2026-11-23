<template>
  <UiHeadBar icon="object:vm">
    {{ vm?.name_label }}
    <template #icon>
      <VtsObjectIcon
        size="medium"
        :state="toLower(vm?.power_state)"
        type="vm"
        :busy="isChangingState"
        :busy-tooltip="currentOperation"
      />
    </template>
    <template #actions>
      <VmHeaderActions v-if="vm !== undefined" :vm />
    </template>
  </UiHeadBar>
</template>

<script lang="ts" setup>
import type { XenApiVm } from '@/libs/xen-api/xen-api.types.ts'
import VmHeaderActions from '@/modules/vm/components/actions/VmHeaderActions.vue'
import { useVmOperation } from '@/modules/vm/composables/vm-operation.composable.ts'
import { useVmStore } from '@/stores/xen-api/vm.store.ts'
import VtsObjectIcon from '@core/components/object-icon/VtsObjectIcon.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import { toLower } from 'lodash-es'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const { getByUuid: getVmByUuid } = useVmStore().subscribe()
const route = useRoute<'/vm/[uuid]'>()

const vm = computed(() => getVmByUuid(route.params.uuid as XenApiVm['uuid']))

const { isChangingState, currentOperation } = useVmOperation(vm)
</script>
