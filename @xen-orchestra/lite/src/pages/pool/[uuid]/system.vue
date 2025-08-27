<template>
  <VtsStateHero v-if="pool === undefined" format="page" type="no-data">{{ t('no-data') }}</VtsStateHero>
  <VtsStateHero v-else-if="!isReady" format="page" busy />
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
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { useI18n } from 'vue-i18n'

const { pool, isReady } = usePoolStore().subscribe()

const { t } = useI18n()

usePageTitleStore().setTitle(useI18n().t('system'))
</script>
