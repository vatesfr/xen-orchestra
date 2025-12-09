<template>
  <VtsStateHero v-if="!areHostsReady" format="page" type="busy" size="large" />
  <VtsStateHero v-else-if="!host" format="page" type="not-found" size="large">
    {{ t('object-not-found', { id: route.params.id }) }}
  </VtsStateHero>
  <RouterView v-else v-slot="{ Component }">
    <HostHeader v-if="uiStore.hasUi" :host />
    <component :is="Component" :host />
  </RouterView>
</template>

<script lang="ts" setup>
import HostHeader from '@/components/host/HostHeader.vue'
import { useXoHostCollection } from '@/remote-resources/use-xo-host-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { useDefaultTab } from '@core/composables/default-tab.composable.ts'
import { useUiStore } from '@core/stores/ui.store'
import type { XoHost } from '@vates/types'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router/auto'

useDefaultTab('/host/[id]', 'dashboard')

const route = useRoute<'/host/[id]'>()

const { areHostsReady, useGetHostById } = useXoHostCollection()
const { t } = useI18n()

const uiStore = useUiStore()

const host = useGetHostById(() => route.params.id as XoHost['id'])
</script>
