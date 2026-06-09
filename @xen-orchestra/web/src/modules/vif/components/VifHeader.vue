<template>
  <div class="breadcrumb-container">
    <UiBreadcrumb :size>
      <UiLink v-if="vm" :size :to="{ name: '/vm/[id]/dashboard', params: { id: vm.id } }">
        <VtsObjectIcon type="vm" :state="vmPowerState" size="current" />
        {{ vm.name_label }}
      </UiLink>
      <UiLink v-if="vm && network" :size :to="{ name: '/vm/[id]/networks', params: { id: vm.id } }">
        {{ t('network') }}
      </UiLink>
      <span>
        <VtsIcon name="object:vif" size="current" />
        {{ t('vif-device', { device: vif.device }) }}
      </span>
    </UiBreadcrumb>
  </div>
  <TabList>
    <RouterLink v-slot="{ isActive, href }" :to="{ name: '/vif/[id]/general', params: { id: vif.id } }" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ t('general') }}
      </TabItem>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" :to="{ name: '/vif/[id]/traffic-rules', params: { id: vif.id } }" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ t('traffic-rules') }}
      </TabItem>
    </RouterLink>
  </TabList>
</template>

<script setup lang="ts">
import { useXoNetworkCollection } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsObjectIcon from '@core/components/object-icon/VtsObjectIcon.vue'
import TabItem from '@core/components/tab/TabItem.vue'
import TabList from '@core/components/tab/TabList.vue'
import UiBreadcrumb from '@core/components/ui/breadcrumb/UiBreadcrumb.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import { toLower } from 'lodash-es'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vif } = defineProps<{ vif: FrontXoVif }>()

const { t } = useI18n()

const uiStore = useUiStore()

const size = computed(() => (uiStore.isSmall ? 'small' : 'medium'))

const { useGetVmById } = useXoVmCollection()
const { useGetNetworkById } = useXoNetworkCollection()

const vm = useGetVmById(() => vif.$VM)
const network = useGetNetworkById(() => vif.$network)

const vmPowerState = computed(() => toLower(vm.value?.power_state))
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
