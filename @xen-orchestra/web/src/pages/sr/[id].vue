<template>
  <VtsStateHero v-if="!areSrsReady" format="page" type="busy" size="large" />
  <VtsStateHero v-else-if="!sr" format="page" type="not-found" size="large">
    {{ t('object-not-found', { id: route.params.id }) }}
  </VtsStateHero>
  <RouterView v-else v-slot="{ Component }">
    <SrHeader v-if="uiStore.hasUi" :sr :scope />
    <component :is="Component" :sr />
  </RouterView>
</template>

<script lang="ts" setup>
import SrHeader from '@/modules/storage-repository/components/header/SrHeader.vue'
import {
  type FrontXoSr,
  useXoSrCollection,
} from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { parseSrScopeQuery } from '@/modules/storage-repository/utils/sr-scope.util.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { useDefaultTab } from '@core/composables/default-tab.composable.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

useDefaultTab('/sr/[id]', 'general')

const route = useRoute<'/sr/[id]'>()

const { t } = useI18n()

const uiStore = useUiStore()

const { areSrsReady, useGetSrById } = useXoSrCollection()

const sr = useGetSrById(() => route.params.id as FrontXoSr['id'])

const scope = computed(() => parseSrScopeQuery(route.query))
</script>
