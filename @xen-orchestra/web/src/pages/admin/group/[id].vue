<template>
  <VtsStateHero v-if="!areGroupsReady" format="page" type="busy" size="large" />
  <VtsStateHero v-else-if="!group" format="page" type="not-found" size="large">
    {{ t('object-not-found', { id: route.params.id }) }}
  </VtsStateHero>
  <RouterView v-else v-slot="{ Component }">
    <GroupHeader v-if="uiStore.hasUi" :group />
    <component :is="Component" :group />
  </RouterView>
</template>

<script lang="ts" setup>
import GroupHeader from '@/modules/group/components/detail/GroupHeader.vue'
import { type FrontXoGroup, useXoGroupCollection } from '@/modules/group/remote-resources/use-xo-group-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { useDefaultTab } from '@core/composables/default-tab.composable.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const route = useRoute<'/admin/group/[id]'>()

useDefaultTab('/admin/group/[id]', 'general')

const uiStore = useUiStore()

const { t } = useI18n()

const { useGetGroupById, areGroupsReady } = useXoGroupCollection()

const group = useGetGroupById(() => route.params.id as FrontXoGroup['id'])
</script>
