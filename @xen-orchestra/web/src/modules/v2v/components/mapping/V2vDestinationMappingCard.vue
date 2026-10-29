<template>
  <UiCard>
    <UiCardTitle>
      {{ t('destination') }}
      <template #description>{{ t('v2v:pool-set-by-list', { pool: poolName }) }}</template>
    </UiCardTitle>
    <template v-if="diskRows.length > 0">
      <UiCardSubtitle>{{ t('disks') }}</UiCardSubtitle>
      <V2vDiskMappingTable
        :rows="diskRows"
        :sr-options
        :loading
        @change-sr="(key, srId) => emit('changeDiskSr', key, srId)"
      />
    </template>
    <template v-if="nicRows.length > 0">
      <UiCardSubtitle>{{ t('network-adapters') }}</UiCardSubtitle>
      <V2vNicMappingTable
        :rows="nicRows"
        :network-options
        :loading
        @change-network="(key, networkId) => emit('changeNicNetwork', key, networkId)"
      />
    </template>
  </UiCard>
</template>

<script lang="ts" setup>
import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import V2vDiskMappingTable from '@/modules/v2v/components/mapping/V2vDiskMappingTable.vue'
import V2vNicMappingTable from '@/modules/v2v/components/mapping/V2vNicMappingTable.vue'
import type { V2vDiskMappingRow, V2vNicMappingRow, V2vTargetOption } from '@/modules/v2v/types/v2v-mapping.type.ts'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardSubtitle from '@core/components/ui/card-subtitle/UiCardSubtitle.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  poolName: string
  diskRows: V2vDiskMappingRow[]
  nicRows: V2vNicMappingRow[]
  srOptions: V2vTargetOption<FrontXoSr['id']>[]
  networkOptions: V2vTargetOption<FrontXoNetwork['id']>[]
  loading: boolean
}>()

const emit = defineEmits<{
  changeDiskSr: [key: V2vDiskMappingRow['key'], srId: FrontXoSr['id'] | undefined]
  changeNicNetwork: [key: V2vNicMappingRow['key'], networkId: FrontXoNetwork['id'] | undefined]
}>()

const { t } = useI18n()
</script>
