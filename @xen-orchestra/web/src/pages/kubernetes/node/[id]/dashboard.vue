<template>
  <VtsStateHero v-if="!areVmsReady" format="page" type="busy" size="large" />
  <VtsStateHero v-else-if="vm === undefined" format="page" type="no-data" size="large">
    {{ t('no-data') }}
  </VtsStateHero>
  <VtsStateHero v-else-if="!isVmRunning" format="page" type="offline" size="large">
    {{ t('vm-not-running') }}
  </VtsStateHero>
  <NodeDashboardUsageCharts v-else :vm />
</template>

<script setup lang="ts">
import NodeDashboardUsageCharts from '@/modules/kubernetes/components/dashboard/NodeDashboardUsageCharts.vue'
import type { XoKubernetesNode } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { VM_POWER_STATE } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { node } = defineProps<{
  node: XoKubernetesNode
}>()

const { t } = useI18n()

const { getVmById, areVmsReady } = useXoVmCollection()

const vm = computed(() => getVmById(node.vm_id))

const isVmRunning = computed(() => vm.value?.power_state === VM_POWER_STATE.RUNNING)
</script>
