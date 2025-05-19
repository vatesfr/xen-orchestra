<template>
  <VtsObjectNotFoundHero v-if="vm === undefined" :id type="page" />
  <VtsColumns v-else :class="{ mobile: uiStore.isMobile }">
    <VtsColumn>
      <VmGeneralInfo :vm />
      <VmSystemNetworking :vm />
      <VmStorageConfig :vm />
      <VmResource :vm />
    </VtsColumn>
    <VtsColumn>
      <VmVirtualizationAndBoot :vm />
      <VmManagement :vm />
      <VmGraphics :vm />
    </VtsColumn>
  </VtsColumns>
</template>

<script lang="ts" setup>
import type { RecordUuid } from '@/libs/xen-api/xen-api.types'
import { usePageTitleStore } from '@/stores/page-title.store'
import { useVmStore } from '@/stores/xen-api/vm.store'
import VtsColumn from '@core/components/column/VtsColumn.vue'
import VtsColumns from '@core/components/columns/VtsColumns.vue'
import VtsObjectNotFoundHero from '@core/components/state-hero/VtsObjectNotFoundHero.vue'
import { useUiStore } from '@core/stores/ui.store'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import VmGeneralInfo from './system/VmGeneralInfo.vue'
import VmGraphics from './system/VmGraphics.vue'
import VmManagement from './system/VmManagement.vue'
import VmResource from './system/VmResource.vue'
import VmStorageConfig from './system/VmStorageConfig.vue'
import VmSystemNetworking from './system/VmSystemNetworking.vue'
import VmVirtualizationAndBoot from './system/VmVirtualizationAndBoot.vue'

const uiStore = useUiStore()
const route = useRoute()
const { getByUuid } = useVmStore().subscribe()

usePageTitleStore().setTitle(useI18n().t('system'))

const id = computed(() => route.params.uuid as RecordUuid<'vm'>)
const vm = computed(() => getByUuid(id.value))
</script>

<style scoped lang="postcss">
.system {
  display: flex;
  gap: 0.8rem;
  padding: 0.8rem;
  width: 100%;
  flex-direction: row;

  .column {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    width: 50%;
  }

  &.mobile {
    flex-direction: column;

    .column {
      width: 100%;
    }
  }
}
</style>
