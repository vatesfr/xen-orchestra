<template>
  <div class="system" :class="className">
    <div class="colum">
      <VmGeneralInfo :vm />
      <VmSystemNetworking :vm />
      <VmStorageConfig :vm />
      <VmResource :vm />
    </div>
    <div class="colum">
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
import { toVariants } from '@core/utils/to-variants.util'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import VmGeneralInfo from './VmGeneralInfo.vue'
import VmGraphics from './VmGraphics.vue'
import VmManagement from './VmManagement.vue'
import VmResource from './VmResource.vue'
import VmStorageConfig from './VmStorageConfig.vue'
import VmSystemNetworking from './VmSystemNetworking.vue'
import VmVirtualisationAndBoot from './VmVirtualisationAndBoot.vue'

const { size } = defineProps<{
  size: 'small' | 'large'
}>()

const route = useRoute()

const { getByUuid } = useVmStore().subscribe()
const vm = computed(() => getByUuid(route.params.uuid as RecordUuid<'vm'>))

usePageTitleStore().setTitle(useI18n().t('system'))

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

  .colum {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  @media not (--mobile) {
    flex-direction: row;

    .colum {
      width: 50%;
    }
  }

  @media (--mobile) {
    flex-direction: column;

    .colum {
      width: 100%;
    }
  }
}
</style>
