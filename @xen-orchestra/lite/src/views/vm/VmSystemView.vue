<template>
  <div class="system">
    <div class="colum">
      <VmGeneralInfo :vm />
      <VmSystemNetworking :vm />
    </div>
    <div class="colum" />
  </div>
</template>

<script lang="ts" setup>
import type { RecordUuid } from '@/libs/xen-api/xen-api.types'
import { usePageTitleStore } from '@/stores/page-title.store'
import { useVmStore } from '@/stores/xen-api/vm.store'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import VmGeneralInfo from './VmGeneralInfo.vue'
import VmSystemNetworking from './VmSystemNetworking.vue'

const route = useRoute()
const { getByUuid } = useVmStore().subscribe()
const vm = computed(() => getByUuid(route.params.uuid as RecordUuid<'vm'>))
usePageTitleStore().setTitle(useI18n().t('system'))
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
    width: 50%;
  }
}
</style>
