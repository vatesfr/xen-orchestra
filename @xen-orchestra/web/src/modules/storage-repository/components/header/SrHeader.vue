<template>
  <SrHeaderBreadcrumb :sr :scope />
  <UiHeadBar>
    <template #icon>
      <VtsObjectIcon type="sr" :state="srConnectionStatus" size="medium" />
    </template>
    {{ sr.name_label }}
  </UiHeadBar>
  <TabList>
    <RouterLink
      v-slot="{ isActive, href }"
      :to="{ name: '/sr/[id]/general', params: { id: sr.id }, query: scopeQuery }"
      custom
    >
      <TabItem :active="isActive" :href tag="a">
        {{ t('general') }}
      </TabItem>
    </RouterLink>
    <RouterLink
      v-slot="{ isActive, href }"
      :to="{ name: '/sr/[id]/hosts', params: { id: sr.id }, query: scopeQuery }"
      custom
    >
      <TabItem :active="isActive" :href tag="a">
        {{ t('hosts') }}
      </TabItem>
    </RouterLink>
    <RouterLink
      v-slot="{ isActive, href }"
      :to="{ name: '/sr/[id]/vdis', params: { id: sr.id }, query: contextQuery }"
      custom
    >
      <TabItem :active="isActive" :href tag="a">
        {{ t('vdis') }}
      </TabItem>
    </RouterLink>
  </TabList>
</template>

<script setup lang="ts">
import SrHeaderBreadcrumb from '@/modules/storage-repository/components/header/SrHeaderBreadcrumb.vue'
import { useXoSrUtils } from '@/modules/storage-repository/composables/xo-sr-utils.composable.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { toSrScopeQuery } from '@/modules/storage-repository/utils/sr-scope.util.ts'
import type { SrScope } from '@core/types/storage-repository.type.ts'
import VtsObjectIcon from '@core/components/object-icon/VtsObjectIcon.vue'
import TabItem from '@core/components/tab/TabItem.vue'
import TabList from '@core/components/tab/TabList.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { sr, scope } = defineProps<{ sr: FrontXoSr; scope: SrScope }>()

const { t } = useI18n()

const scopeQuery = computed(() => toSrScopeQuery(scope))

const { srConnectionStatus } = useXoSrUtils(
  () => sr,
  () => scope
)
</script>
