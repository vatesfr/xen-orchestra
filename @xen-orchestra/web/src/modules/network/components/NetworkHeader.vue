<template>
  <div class="breadcrumb-container">
    <UiBreadcrumb :size>
      <UiLink v-if="pool" :size :to="{ name: '/pool/[id]/dashboard', params: { id: pool.id } }" icon="object:pool">
        {{ pool.name_label }}
      </UiLink>
      <UiLink :size :to="{ name: '/pool/[id]/networks', params: { id: network.$pool } }">
        {{ t('network') }}
      </UiLink>
      <span>
        <VtsIcon name="object:network" size="current" />
        {{ network.name_label }}
      </span>
    </UiBreadcrumb>
  </div>
  <UiHeadBar icon="object:network">
    {{ network.name_label }}
  </UiHeadBar>
  <TabList>
    <RouterLink v-slot="{ isActive, href }" :to="{ name: '/network/[id]/general', params: { id: network.id } }" custom>
      <UiTabItem :active="isActive" :href tag="a">
        {{ t('general') }}
      </UiTabItem>
    </RouterLink>
    <RouterLink
      v-if="!isInternalNetwork"
      v-slot="{ isActive, href }"
      :to="{ name: '/network/[id]/pifs', params: { id: network.id } }"
      custom
    >
      <UiTabItem :active="isActive" :href tag="a">
        {{ t('pifs') }}
      </UiTabItem>
    </RouterLink>
  </TabList>
</template>

<script setup lang="ts">
import { useXoNetworkUtils } from '@/modules/network/composables/xo-network-utils.composable.ts'
import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import TabList from '@core/components/tab-list/TabList.vue'
import UiBreadcrumb from '@core/components/ui/breadcrumb/UiBreadcrumb.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTabItem from '@core/components/ui/tab-item/UiTabItem.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { network } = defineProps<{ network: FrontXoNetwork }>()

const { t } = useI18n()

const uiStore = useUiStore()

const size = computed(() => (uiStore.isSmall ? 'small' : 'medium'))

const { useGetPoolById } = useXoPoolCollection()

const pool = useGetPoolById(() => network.$pool)

const { isInternalNetwork } = useXoNetworkUtils(() => network)
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
</style>
