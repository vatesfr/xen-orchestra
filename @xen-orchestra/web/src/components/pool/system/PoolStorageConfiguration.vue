<template>
  <UiCard class="pool-storage-configuration">
    <UiTitle>
      {{ $t('storage-configuration') }}
    </UiTitle>
    <VtsQuickInfoRow :label="$t('default-storage-repository')">
      <template #value>
        <template v-if="defaultSr?.name_label">
          <!-- add link when sr pages is created -->
          {{ defaultSr?.name_label }}
        </template>
        <template v-else>
          {{ $t('none') }}
        </template>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('suspend-storage-repository')">
      <template #value>
        <template v-if="defaultSr?.name_label">
          <!-- add link when sr pages is created -->
          {{ suspendSr?.name_label }}
        </template>
        <template v-else>
          {{ $t('none') }}
        </template>
      </template>
    </VtsQuickInfoRow>

    <VtsQuickInfoRow :label="$t('crash-dump-storage-repository')">
      <template #value>
        <template v-if="defaultSr?.name_label">
          <!-- add link when sr pages is created -->
          {{ crashDumpSr?.name_label }}
        </template>
        <template v-else>
          {{ $t('none') }}
        </template>
      </template>
    </VtsQuickInfoRow>

    <VtsQuickInfoRow :label="$t('heartbeat-storage-repository')">
      <template #value>
        <UiTagsList v-if="haSrs">
          <UiTag v-for="haSr in haSrs" :key="haSr?.id" accent="info" variant="secondary">
            <!-- add link when sr pages is created -->
            {{ haSr?.name_label }}
          </UiTag>
        </UiTagsList>
        <template v-else>
          {{ $t('none') }}
        </template>
      </template>
    </VtsQuickInfoRow>
  </UiCard>
</template>

<script setup lang="ts">
import { useSrStore } from '@/stores/xo-rest-api/sr.store'
import type { XoPool } from '@/types/xo/pool.type'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed } from 'vue'

const { pool } = defineProps<{
  pool: XoPool
}>()

const { get: getSrById } = useSrStore().subscribe()

const defaultSr = computed(() => (pool.default_SR ? getSrById(pool.default_SR) : undefined))
const suspendSr = computed(() => (pool.suspendSr ? getSrById(pool.suspendSr) : undefined))
const crashDumpSr = computed(() => (pool.crashDumpSr ? getSrById(pool.crashDumpSr) : undefined))
const haSrs = computed(() => (pool.haSrs ? pool.haSrs.map(Sr => getSrById(Sr)) : undefined))
</script>
