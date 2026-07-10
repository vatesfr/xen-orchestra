<template>
  <div class="breadcrumb-container">
    <UiBreadcrumb v-if="scope?.type === SR_SCOPE_TYPE.HOST && host" :size>
      <UiLink :size :to="{ name: '/host/[id]/dashboard', params: { id: host.id } }">
        <VtsObjectIcon type="host" :state="toLower(host.power_state)" size="current" />
        {{ host.name_label }}
      </UiLink>
      <UiLink :size :to="{ name: '/host/[id]/storage', params: { id: host.id } }">
        {{ t('storage') }}
      </UiLink>
      <span class="sr-name">
        <VtsObjectIcon type="sr" :state="srConnectionStatus" size="current" />
        {{ sr.name_label }}
      </span>
    </UiBreadcrumb>
    <UiBreadcrumb v-else-if="scope?.type === SR_SCOPE_TYPE.POOL && pool" :size>
      <UiLink :size :to="{ name: '/pool/[id]/dashboard', params: { id: pool.id } }">
        <VtsIcon name="object:pool" size="current" />
        {{ pool.name_label }}
      </UiLink>
      <UiLink :size :to="{ name: '/pool/[id]/storage', params: { id: pool.id } }">
        {{ t('storage') }}
      </UiLink>
      <span class="sr-name">
        <VtsObjectIcon type="sr" :state="srConnectionStatus" size="current" />
        {{ sr.name_label }}
      </span>
    </UiBreadcrumb>
  </div>
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
import { type FrontXoHost, useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoSrUtils } from '@/modules/storage-repository/composables/xo-sr-utils.composable.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsObjectIcon from '@core/components/object-icon/VtsObjectIcon.vue'
import TabItem from '@core/components/tab/TabItem.vue'
import TabList from '@core/components/tab/TabList.vue'
import UiBreadcrumb from '@core/components/ui/breadcrumb/UiBreadcrumb.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import { SR_SCOPE_TYPE, type SrScope } from '@core/types/storage-repository.type.ts'
import { toLower } from 'lodash-es'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { sr, scope } = defineProps<{ sr: FrontXoSr; scope?: SrScope }>()

const { t } = useI18n()

const uiStore = useUiStore()

const size = computed(() => (uiStore.isSmall ? 'small' : 'medium'))

const { useGetPoolById } = useXoPoolCollection()

const pool = useGetPoolById(() => sr.$pool)

const { useGetHostById } = useXoHostCollection()

const host = useGetHostById(() =>
  scope?.type === SR_SCOPE_TYPE.HOST ? (scope.hostId as FrontXoHost['id']) : undefined
)

const { srConnectionStatus } = useXoSrUtils(() => sr)
</script>

<style lang="postcss" scoped>
.breadcrumb-container {
  min-height: 5.6rem;
  padding: 1.2rem 1.6rem;
  display: flex;
  gap: 1.6rem;
  align-items: center;
  border-bottom: 0.1rem solid var(--color-neutral-border);
  background-color: var(--color-neutral-background-primary);
  justify-content: space-between;
  overflow-y: auto;
}

.sr-name {
  display: flex;
  align-items: center;
  gap: 1rem;
}
</style>
