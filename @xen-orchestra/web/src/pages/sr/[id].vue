<template>
  <VtsStateHero v-if="!areSrsReady" format="page" type="busy" size="large" />
  <VtsStateHero v-else-if="!sr" format="page" type="not-found" size="large">
    {{ t('object-not-found', { id: route.params.id }) }}
  </VtsStateHero>
  <RouterView v-else v-slot="{ Component }">
    <SrHeader :sr :host :from-context="fromContext" />
    <component :is="Component" :sr />
  </RouterView>
</template>

<script lang="ts" setup>
import { useXoHostCollection, type FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import SrHeader from '@/modules/storage-repository/components/SrHeader.vue'
import {
  type FrontXoSr,
  useXoSrCollection,
} from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { SR_PAGE_CONTEXT, type SrPageContext } from '@/shared/constants.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { useDefaultTab } from '@core/composables/default-tab.composable.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

useDefaultTab('/sr/[id]', 'general')

const route = useRoute<'/sr/[id]'>()

const { t } = useI18n()

const { areSrsReady, useGetSrById } = useXoSrCollection()

const sr = useGetSrById(() => route.params.id as FrontXoSr['id'])

const fromContext = computed<SrPageContext>(() =>
  route.query.from === SR_PAGE_CONTEXT.HOST ? SR_PAGE_CONTEXT.HOST : SR_PAGE_CONTEXT.POOL
)

const { useGetHostById } = useXoHostCollection()

const host = useGetHostById(() =>
  fromContext.value === SR_PAGE_CONTEXT.HOST ? (route.query.host as FrontXoHost['id']) : undefined
)
</script>
