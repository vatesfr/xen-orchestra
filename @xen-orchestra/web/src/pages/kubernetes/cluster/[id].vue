<template>
  <VtsStateHero v-if="!areClustersReady" format="page" type="busy" size="large" />
  <VtsStateHero v-else-if="!cluster" format="page" type="not-found" size="large">
    {{ t('object-not-found', { id: route.params.id }) }}
  </VtsStateHero>
  <ClusterHeader v-else :cluster />
</template>

<script setup lang="ts">
import ClusterHeader from '@/modules/kubernetes/components/ClusterHeader.vue'
import { useXoKubernetesClusterCollection } from '@/modules/kubernetes/remote-resources/use-xo-kubernetes-cluster-collection.ts'
import type { FrontXoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const route = useRoute<'/kubernetes/cluster/[id]'>()

const { t } = useI18n()

const { areClustersReady, useGetClusterById } = useXoKubernetesClusterCollection()

const cluster = useGetClusterById(() => route.params.id as FrontXoKubernetesCluster['id'])
</script>
