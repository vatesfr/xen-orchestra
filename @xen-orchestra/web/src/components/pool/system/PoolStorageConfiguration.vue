<template>
  <UiCard>
    <UiTitle>
      {{ t('storage-configuration') }}
    </UiTitle>
    <VtsLoadingHero v-if="!areSrsReady" type="card" />
    <template v-else>
      <VtsQuickInfoRow :label="t('default-storage-repository')">
        <template #value>
          <template v-if="defaultSr">
            <VtsIcon name="fa:database" size="medium" />
            {{ defaultSr.name_label }}
          </template>
          <template v-else>
            {{ t('none') }}
          </template>
        </template>
      </VtsQuickInfoRow>
      <VtsQuickInfoRow :label="t('suspend-storage-repository')">
        <template #value>
          <template v-if="suspendSr">
            <VtsIcon name="fa:database" size="medium" />
            {{ suspendSr.name_label }}
          </template>
          <template v-else>
            {{ t('none') }}
          </template>
        </template>
      </VtsQuickInfoRow>
      <VtsQuickInfoRow :label="t('crash-dump-storage-repository')">
        <template #value>
          <template v-if="crashDumpSr">
            <VtsIcon name="fa:database" size="medium" />
            {{ crashDumpSr.name_label }}
          </template>
          <template v-else>
            {{ t('none') }}
          </template>
        </template>
      </VtsQuickInfoRow>
      <VtsQuickInfoRow :label="t('heartbeat-storage-repository')">
        <template #value>
          <ul v-if="haSrs.length > 0">
            <li v-for="haSr in haSrs" :key="haSr.id">
              <VtsIcon name="fa:database" size="medium" />
              {{ haSr.name_label }}
            </li>
          </ul>
          <template v-else>
            {{ t('none') }}
          </template>
        </template>
      </VtsQuickInfoRow>
    </template>
  </UiCard>
</template>

<script lang="ts" setup>
import { useXoSrCollection } from '@/remote-resources/use-xo-sr-collection.ts'
import type { XoPool } from '@/types/xo/pool.type'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

const { pool } = defineProps<{
  pool: XoPool
}>()

const { t } = useI18n()

const { useGetSrById, useGetSrsByIds, areSrsReady } = useXoSrCollection()

const defaultSr = useGetSrById(() => pool.default_SR)
const suspendSr = useGetSrById(() => pool.suspendSr)
const crashDumpSr = useGetSrById(() => pool.crashDumpSr)
const haSrs = useGetSrsByIds(() => pool.haSrs ?? [])
</script>
