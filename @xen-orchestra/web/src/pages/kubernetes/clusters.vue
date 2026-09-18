<template>
  <KubernetesHeader />
  <VtsContentSidePanel class="kubernetes-clusters">
    <UiCard class="container">
      <ClustersTable
        :clusters
        :busy="!areClustersReady"
        :error="hasClusterFetchError"
      />
    </UiCard>
    <ClusterSidePanel :cluster="selectedCluster" @close="selectedCluster = undefined" />
  </VtsContentSidePanel>
</template>

<script setup lang="ts">
import KubernetesHeader from '@/modules/kubernetes/components/KubernetesHeader.vue'
import ClustersTable from '@/modules/kubernetes/components/list/ClustersTable.vue'
import ClusterSidePanel from '@/modules/kubernetes/components/list/panel/ClusterSidePanel.vue'
import { useXoKubernetesClusterCollection } from '@/modules/kubernetes/remote-resources/use-xo-kubernetes-cluster-collection.ts'
import type { FrontXoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'

const { clusters, areClustersReady, hasClusterFetchError, getClusterById } = useXoKubernetesClusterCollection()

const selectedCluster = useRouteQuery<FrontXoKubernetesCluster | undefined>('id', {
  toData: id => getClusterById(id as FrontXoKubernetesCluster['id']),
  toQuery: cluster => cluster?.id ?? '',
})
</script>

<style scoped lang="postcss">
.kubernetes-clusters {
  .container {
    height: fit-content;
    gap: 4rem;
    margin: 0.8rem;
  }
}
</style>
