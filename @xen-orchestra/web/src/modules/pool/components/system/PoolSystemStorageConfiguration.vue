<template>
  <UiCard>
    <UiTitle>
      {{ t('storage-configuration') }}
    </UiTitle>
    <VtsStateHero v-if="!areSrsReady" format="card" type="busy" size="medium" />
    <template v-else>
      <VtsQuickInfoRow :label="t('default-storage-repository')">
        <template #value>
          <template v-if="defaultSr">
            <VtsIcon name="object:sr" size="medium" />
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
            <VtsIcon name="object:sr" size="medium" />
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
            <VtsIcon name="object:sr" size="medium" />
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
              <VtsIcon name="object:sr" size="medium" />
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
import { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import type { XoPool } from '@vates/types'
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
