<template>
  <VtsStateHero v-if="objectId === undefined" format="page" type="not-found" size="large">
    {{ t('object-not-found', { id: route.params.id }) }}
  </VtsStateHero>
  <NodeHeader v-else :name="objectId" />
</template>

<script setup lang="ts">
import NodeHeader from '@/modules/kubernetes/components/NodeHeader.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const route = useRoute<'/kubernetes/node/[id]'>()

const { t } = useI18n()

const objectId = computed(() => route.params.id)
</script>
