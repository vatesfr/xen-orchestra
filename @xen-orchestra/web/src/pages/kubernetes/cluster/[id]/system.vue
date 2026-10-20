<template>
  <VtsStateHero v-if="hasClusterFetchError" format="page" type="error" size="large">
    {{ t('error-no-data') }}
  </VtsStateHero>
  <VtsStateHero v-else-if="!isClusterReady || detailedCluster === undefined" format="page" type="busy" size="large" />
  <VtsColumns v-else extra-space-around>
    <VtsColumn>
      <ClusterSystemGeneralInformation :cluster="detailedCluster" />
    </VtsColumn>
    <VtsColumn>
      <ClusterSystemStatus :cluster="detailedCluster" />
      <ClusterSystemNetworking :cluster="detailedCluster" />
    </VtsColumn>
  </VtsColumns>
</template>

<script setup lang="ts">
import ClusterSystemGeneralInformation from '@/modules/kubernetes/components/system/ClusterSystemGeneralInformation.vue'
import ClusterSystemNetworking from '@/modules/kubernetes/components/system/ClusterSystemNetworking.vue'
import ClusterSystemStatus from '@/modules/kubernetes/components/system/ClusterSystemStatus.vue'
import { useXoKubernetesCluster } from '@/modules/kubernetes/remote-resources/use-xo-kubernetes-cluster.ts'
import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import VtsColumn from '@core/components/column/VtsColumn.vue'
import VtsColumns from '@core/components/columns/VtsColumns.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { useI18n } from 'vue-i18n'

const { cluster } = defineProps<{
  cluster: XoKubernetesCluster
}>()

const { t } = useI18n()

const { cluster: detailedCluster, isClusterReady, hasClusterFetchError } = useXoKubernetesCluster({}, () => cluster.id)
</script>
