<template>
  <VtsStateHero v-if="!areNodesReady" format="page" type="busy" size="large" />
  <VtsStateHero v-else-if="!node" format="page" type="not-found" size="large">
    {{ t('object-not-found', { id: route.params.id }) }}
  </VtsStateHero>
  <NodeHeader v-else :node />
</template>

<script setup lang="ts">
import NodeHeader from '@/modules/kubernetes/components/NodeHeader.vue'
import { useXoKubernetesNodeCollection } from '@/modules/kubernetes/remote-resources/use-xo-kubernetes-node-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const route = useRoute<'/kubernetes/node/[id]'>()

const { t } = useI18n()

const { areNodesReady, useGetNodeById } = useXoKubernetesNodeCollection()

const node = useGetNodeById(() => route.params.id)
</script>
