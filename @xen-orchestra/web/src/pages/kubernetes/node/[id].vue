<template>
  <VtsStateHero v-if="!areNodesReady" format="page" type="busy" size="large" />
  <VtsStateHero v-else-if="!node" format="page" type="not-found" size="large">
    {{ t('object-not-found', { id: route.params.id }) }}
  </VtsStateHero>
  <RouterView v-else v-slot="{ Component }">
    <NodeHeader :node />
    <component :is="Component" :node />
  </RouterView>
</template>

<script setup lang="ts">
import NodeHeader from '@/modules/kubernetes/components/NodeHeader.vue'
import { useXoKubernetesNodeCollection } from '@/modules/kubernetes/remote-resources/use-xo-kubernetes-node-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { useDefaultTab } from '@core/composables/default-tab.composable.ts'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

useDefaultTab('/kubernetes/node/[id]', 'system')

const route = useRoute<'/kubernetes/node/[id]'>()

const { t } = useI18n()

const { areNodesReady, useGetNodeById } = useXoKubernetesNodeCollection()

const node = useGetNodeById(() => route.params.id)
</script>
