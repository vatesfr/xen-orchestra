<template>
  <div class="breadcrumb-container">
    <UiBreadcrumb :size>
      <UiLink v-if="vm" :size :to="{ name: '/vm/[uuid]/dashboard', params: { uuid: vm.uuid } }">
        <VtsObjectIcon type="vm" :state="toLower(vm.power_state)" size="current" />
        {{ vm.name_label }}
      </UiLink>
      <UiLink v-if="vm" :size :to="{ name: '/vm/[uuid]/network', params: { uuid: vm.uuid } }">
        {{ t('network') }}
      </UiLink>
      <span>
        <VtsIcon name="object:vif" size="current" />
        {{ t('vif-device', { device: vif.device }) }}
      </span>
    </UiBreadcrumb>
  </div>
  <UiHeadBar icon="object:vif">
    {{ t('vif-device', { device: vif.device }) }}
  </UiHeadBar>
  <TabList>
    <RouterLink v-slot="{ isActive, href }" :to="getVifRoute(vif.uuid)" custom>
      <UiTabItem :active="isActive" :href tag="a">
        {{ t('general') }}
      </UiTabItem>
    </RouterLink>
  </TabList>
</template>

<script setup lang="ts">
import type { XenApiVif } from '@/libs/xen-api/xen-api.types.ts'
import { getVifRoute } from '@/modules/vif/utils/vif.util.ts'
import { useVmStore } from '@/stores/xen-api/vm.store.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsObjectIcon from '@core/components/object-icon/VtsObjectIcon.vue'
import TabList from '@core/components/tab-list/TabList.vue'
import UiBreadcrumb from '@core/components/ui/breadcrumb/UiBreadcrumb.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTabItem from '@core/components/ui/tab-item/UiTabItem.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import { toLower } from 'lodash-es'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vif } = defineProps<{ vif: XenApiVif }>()

const { t } = useI18n()

const uiStore = useUiStore()

const size = computed(() => (uiStore.isSmall ? 'small' : 'medium'))

const { getByOpaqueRef: getVmByOpaqueRef } = useVmStore().subscribe()

const vm = computed(() => getVmByOpaqueRef(vif.VM))
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
