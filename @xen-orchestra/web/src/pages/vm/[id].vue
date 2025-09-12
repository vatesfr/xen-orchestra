<template>
  <VtsStateHero v-if="!areVmsReady" format="page" busy size="large" />
  <VtsStateHero v-else-if="!vm" format="page" type="not-found" size="large">
    {{ t('object-not-found', { id: route.params.id }) }}
  </VtsStateHero>
  <RouterView v-else v-slot="{ Component }">
    <VmHeader v-if="uiStore.hasUi" :vm />
    <component :is="Component" :vm />
  </RouterView>
</template>

<script lang="ts" setup>
import VmHeader from '@/components/vm/VmHeader.vue'
import { useXoVmCollection } from '@/remote-resources/use-xo-vm-collection.ts'
import type { XoVm } from '@/types/xo/vm.type'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { useDefaultTab } from '@core/composables/default-tab.composable.ts'
import { useUiStore } from '@core/stores/ui.store'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

useDefaultTab('/vm/[id]', 'dashboard')

const route = useRoute<'/vm/[id]'>()

const { t } = useI18n()

const { areVmsReady, useGetVmById } = useXoVmCollection()
const uiStore = useUiStore()

const vm = useGetVmById(() => route.params.id as XoVm['id'])
</script>
