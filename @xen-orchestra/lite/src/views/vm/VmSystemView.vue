<template>
  <VtsObjectNotFoundHero v-if="vm === undefined" :id type="page" :class="{ mobile: uiStore.isMobile }" />
  <div v-else class="system" :class="className">
    <div class="column">
      <VmGeneralInfo :vm />
      <VmSystemNetworking :vm />
      <VmStorageConfig :vm />
      <VmResource :vm />
    </div>
    <div class="column">
      <VmVirtualisationAndBoot :vm />
      <VmManagement :vm />
      <VmGraphics :vm />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { RecordUuid } from '@/libs/xen-api/xen-api.types'
import { usePageTitleStore } from '@/stores/page-title.store'
import { useVmStore } from '@/stores/xen-api/vm.store'
import VtsObjectNotFoundHero from '@core/components/state-hero/VtsObjectNotFoundHero.vue'
import { useUiStore } from '@core/stores/ui.store'
import { toVariants } from '@core/utils/to-variants.util'
import type { XenApiVm } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import VmGeneralInfo from './system/VmGeneralInfo.vue'
import VmGraphics from './system/VmGraphics.vue'
import VmManagement from './system/VmManagement.vue'
import VmResource from './system/VmResource.vue'
import VmStorageConfig from './system/VmStorageConfig.vue'
import VmSystemNetworking from './system/VmSystemNetworking.vue'
import VmVirtualisationAndBoot from './system/VmVirtualisationAndBoot.vue'

const { size } = defineProps<{
  size: 'small' | 'large'
}>()

const uiStore = useUiStore()
const route = useRoute()
const { getByUuid } = useVmStore().subscribe()

usePageTitleStore().setTitle(useI18n().t('system'))

const id = computed(() => route.params.uuid as XenApiVm['uuid'])
const vm = computed(() => getByUuid(route.params.uuid as RecordUuid<'vm'>))
const className = computed(() =>
  toVariants({
    size,
  })
)
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
