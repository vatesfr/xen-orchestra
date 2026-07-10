<template>
  <SrHeaderBreadcrumbLink :sr :host :from-context="fromContext" />
  <UiHeadBar>
    <template #icon>
      <VtsObjectIcon type="sr" :state="srConnectionStatus" size="medium" />
    </template>
    {{ sr.name_label }}
  </UiHeadBar>
  <TabList>
    <RouterLink v-slot="{ isActive, href }" :to="{ name: '/sr/[id]/general', params: { id: sr.id } }" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ t('general') }}
      </TabItem>
    </RouterLink>
  </TabList>
</template>

<script setup lang="ts">
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import SrHeaderBreadcrumbLink from '@/modules/storage-repository/components/header/SrHeaderBreadcrumbLink.vue'
import { useXoSrUtils } from '@/modules/storage-repository/composables/xo-sr-utils.composable.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { SrPageContext } from '@/shared/constants.ts'
import VtsObjectIcon from '@core/components/object-icon/VtsObjectIcon.vue'
import TabItem from '@core/components/tab/TabItem.vue'
import TabList from '@core/components/tab/TabList.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import { useI18n } from 'vue-i18n'

const { sr, host, fromContext } = defineProps<{ sr: FrontXoSr; host?: FrontXoHost; fromContext?: SrPageContext }>()

const { t } = useI18n()

const { srConnectionStatus } = useXoSrUtils(() => sr)
</script>
