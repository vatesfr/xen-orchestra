<template>
  <UiCard class="pool-vms-view">
    <UiCardTitle subtitle>
      {{ t('vms', 2) }}
      <template v-if="uiStore.isMobile" #right>
        <VmsActionsBar :selected-refs="selectedVmsRefs" />
      </template>
    </UiCardTitle>
    <VmsActionsBar v-if="!uiStore.isMobile" :selected-refs="selectedVmsRefs" />
    <VmsTable :vms :busy="!isReady" />
  </UiCard>
</template>

<script lang="ts" setup>
import UiCard from '@/components/ui/UiCard.vue'
import UiCardTitle from '@/components/ui/UiCardTitle.vue'
import VmsActionsBar from '@/components/vm/VmsActionsBar.vue'
import VmsTable from '@/components/vm/VmsTable.vue'
import { usePageTitleStore } from '@/stores/page-title.store'
import { useVmStore } from '@/stores/xen-api/vm.store'
import { useUiStore } from '@core/stores/ui.store'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const titleStore = usePageTitleStore()
titleStore.setTitle(t('vms', 2))

const { records: vms, isReady } = useVmStore().subscribe()

const uiStore = useUiStore()

const selectedVmsRefs = ref([])

titleStore.setCount(() => selectedVmsRefs.value.length)
</script>

<style lang="postcss" scoped>
.pool-vms-view {
  overflow: auto;
  margin: 1rem;
}

.vm-name {
  display: inline-flex;
  align-items: center;
  gap: 1rem;
}
</style>
