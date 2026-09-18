<template>
  <VtsSidePanel :has-selection="!!cluster" @close="emit('close')">
    <template v-if="cluster">
      <UiPanelCard>
        <VtsCardObjectTitle
          :id="cluster.id"
          :label="cluster.name"
          :to="getKubernetesClusterRoute(cluster.id)"
          icon="object:cluster"
        />
      </UiPanelCard>
    </template>
  </VtsSidePanel>
</template>

<script setup lang="ts">
import type { FrontXoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { getKubernetesClusterRoute } from '@/modules/kubernetes/utils/kubernetes-routes.util.ts'
import VtsCardObjectTitle from '@core/components/card-object-title/VtsCardObjectTitle.vue'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'

defineProps<{
  cluster?: FrontXoKubernetesCluster
}>()

const emit = defineEmits<{
  close: []
}>()
</script>
