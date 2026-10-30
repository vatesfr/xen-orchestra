<template>
  <ObjectNotFoundWrapper :is-ready :uuid-checker="hasUuid">
    <template v-if="vif">
      <VifHeader v-if="uiStore.hasUi" :vif />
      <RouterView v-slot="{ Component }">
        <component :is="Component" :vif />
      </RouterView>
    </template>
  </ObjectNotFoundWrapper>
</template>

<script lang="ts" setup>
import ObjectNotFoundWrapper from '@/components/ObjectNotFoundWrapper.vue'
import type { XenApiVif } from '@/libs/xen-api/xen-api.types.ts'
import VifHeader from '@/modules/vif/components/VifHeader.vue'
import { useVifStore } from '@/stores/xen-api/vif.store.ts'
import { useDefaultTab } from '@core/composables/default-tab.composable.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

useDefaultTab('/vif/[uuid]', 'general')

const route = useRoute<'/vif/[uuid]'>()
const uiStore = useUiStore()
const { getByUuid, hasUuid, isReady } = useVifStore().subscribe()

const vif = computed(() => getByUuid(route.params.uuid as XenApiVif['uuid']))
</script>
