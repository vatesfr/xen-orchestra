<template>
  <UiCard :has-error="isError">
    <UiCardTitle>
      {{ t('backup:last-replication') }}
    </UiCardTitle>
    <VtsStateHero v-if="!areReplicationReady" format="card" type="busy" size="medium" />
    <VtsStateHero v-else-if="isError" format="card" type="error" size="extra-small" horizontal>
      {{ t('error-no-data') }}
    </VtsStateHero>
    <VtsStateHero v-else-if="isEmpty" format="card" type="no-data" size="extra-small" horizontal>
      {{ t('no-replicated-vm') }}
    </VtsStateHero>
    <div v-else class="replication">
      <VtsQuickInfoRow :label="t('vm')">
        <template #value>
          <VtsObjectIcon size="medium" :state="toLower(vm?.power_state)" type="vm" />
          <UiLink size="medium" :to="{ name: '/vm/[id]/dashboard', params: { id: vm?.id } }">
            {{ vm?.name_label }}
          </UiLink>
        </template>
      </VtsQuickInfoRow>
      <VtsQuickInfoRow :label="t('date')" :value="formattedDate" />
      <VtsQuickInfoRow :label="t('storage-repository')">
        <template #value>
          <UiLink :icon="srStatusIcon" size="medium">
            {{ storageRepository?.name_label }}
          </UiLink>
        </template>
      </VtsQuickInfoRow>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import { useXoSrUtils } from '@/modules/storage-repository/composables/xo-sr-utils.composable.ts'
import {
  type FrontXoSr,
  useXoSrCollection,
} from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { type FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { XoVmDashboard } from '@/modules/vm/types/vm-dashboard.type.ts'
import VtsObjectIcon from '@core/components/object-icon/VtsObjectIcon.vue'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { toLower } from 'lodash-es'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { hasError, vmDashboard } = defineProps<{
  vmDashboard: XoVmDashboard | undefined
  hasError: boolean
}>()

const { getSrById, areSrsReady, hasSrFetchError } = useXoSrCollection()
const { getVmById } = useXoVmCollection()

const { t, d } = useI18n()

const replication = computed(() => vmDashboard?.backupsInfo?.replication)

const areReplicationReady = computed(() => areSrsReady.value && replication.value !== undefined)

const isError = computed(() => hasSrFetchError.value || hasError)

const isEmpty = computed(() => replication.value !== undefined && Object.keys(replication.value).length === 0)

const vm = computed<FrontXoVm | undefined>(() => (replication.value ? getVmById(replication.value.id) : undefined))

const storageRepository = computed<FrontXoSr | undefined>(() =>
  replication.value ? getSrById(replication.value.sr) : undefined
)

const formattedDate = computed(() =>
  replication.value
    ? d(replication.value.timestamp, { dateStyle: 'short', timeStyle: 'medium' }).replace(/\//g, '-')
    : undefined
)

const { srStatusIcon } = useXoSrUtils(() => storageRepository.value as FrontXoSr)
</script>

<style lang="postcss" scoped>
.replication {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
}
</style>
