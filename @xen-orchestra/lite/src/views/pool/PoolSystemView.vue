<template>
  <VtsNoDataHero v-if="pool === undefined" type="page" />
  <VtsLoadingHero v-else-if="!isReady" type="page" />
  <VtsColumns v-else>
    <VtsColumn>
      <PoolGeneralInfo :pool />
      <PoolNetworking :pool />
      <PoolStorageConfiguration :pool />
    </VtsColumn>
    <VtsColumn>
      <PoolManagement :pool />
    </VtsColumn>
  </VtsColumns>
</template>

<script lang="ts" setup>
import PoolGeneralInfo from '@/components/pool/system/PoolGeneralInfo.vue'
import PoolManagement from '@/components/pool/system/PoolManagement.vue'
import PoolNetworking from '@/components/pool/system/PoolNetworking.vue'
import PoolStorageConfiguration from '@/components/pool/system/PoolStorageConfiguration.vue'
import { usePageTitleStore } from '@/stores/page-title.store'
import { usePoolStore } from '@/stores/xen-api/pool.store'
import VtsColumn from '@core/components/column/VtsColumn.vue'
import VtsColumns from '@core/components/columns/VtsColumns.vue'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import VtsNoDataHero from '@core/components/state-hero/VtsNoDataHero.vue'
import { useI18n } from 'vue-i18n'

const { pool, isReady } = usePoolStore().subscribe()

usePageTitleStore().setTitle(useI18n().t('system'))
</script>
