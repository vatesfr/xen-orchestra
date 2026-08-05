<template>
  <SrHeaderBreadcrumbLink :sr :from-context="fromContext" />
  <UiHeadBar>
    <template #icon>
      <VtsObjectIcon type="sr" :state="srIconState" size="medium" />
    </template>
    {{ sr.name_label }}
    <template v-if="isDefaultSr(sr)" #status>
      <VtsIcon v-tooltip="t('default-storage-repository')" name="status:primary-circle" size="medium" />
    </template>
  </UiHeadBar>
  <TabList>
    <RouterLink
      v-slot="{ isActive, href }"
      :to="{ name: '/sr/[id]/general', params: { id: sr.id }, query: contextQuery }"
      custom
    >
      <TabItem :active="isActive" :href tag="a">
        {{ t('general') }}
      </TabItem>
    </RouterLink>
    <RouterLink
      v-slot="{ isActive, href }"
      :to="{ name: '/sr/[id]/hosts', params: { id: sr.id }, query: contextQuery }"
      custom
    >
      <TabItem :active="isActive" :href tag="a">
        {{ t('hosts') }}
      </TabItem>
    </RouterLink>
  </TabList>
</template>

<script setup lang="ts">
import { useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import SrHeaderBreadcrumbLink from '@/modules/storage-repository/components/header/SrHeaderBreadcrumbLink.vue'
import { useXoSrUtils } from '@/modules/storage-repository/composables/xo-sr-utils.composable.ts'
import { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsObjectIcon from '@core/components/object-icon/VtsObjectIcon.vue'
import TabItem from '@core/components/tab/TabItem.vue'
import TabList from '@core/components/tab/TabList.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import { SR_SCOPE_TYPE, type SrScope } from '@core/types/storage-repository.type.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { arePbdsReady } = useXoPbdCollection()

const { isDefaultSr } = useXoSrCollection()

const srIconState = computed(() => (arePbdsReady.value ? srConnectionStatus.value : undefined))

const { sr, fromContext } = defineProps<{ sr: FrontXoSr; fromContext?: SrScope }>()

const { t } = useI18n()

const contextQuery = computed(() =>
  fromContext?.type === SR_SCOPE_TYPE.HOST ? { from: SR_SCOPE_TYPE.HOST, host: fromContext.hostId } : {}
)

const { srConnectionStatus } = useXoSrUtils(() => sr)
</script>
