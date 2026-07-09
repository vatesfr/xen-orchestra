<template>
  <VtsColumns extra-space-around>
    <VtsColumn>
      <StorageRepositoryGeneralInformation :sr />
      <StorageRepositoryPbdDetails :sr />
    </VtsColumn>
    <VtsColumn>
      <StorageRepositorySpace :sr />
      <StorageRepositoryCustomFields :sr />
    </VtsColumn>
  </VtsColumns>
</template>

<script setup lang="ts">
import StorageRepositoryCustomFields from '@/modules/storage-repository/components/general/StorageRepositoryCustomFields.vue'
import StorageRepositoryGeneralInformation from '@/modules/storage-repository/components/general/StorageRepositoryGeneralInformation.vue'
import StorageRepositoryPbdDetails from '@/modules/storage-repository/components/general/StorageRepositoryPbdDetails.vue'
import StorageRepositorySpace from '@/modules/storage-repository/components/general/StorageRepositorySpace.vue'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import VtsColumn from '@core/components/column/VtsColumn.vue'
import VtsColumns from '@core/components/columns/VtsColumns.vue'

const { sr } = defineProps<{
  sr: FrontXoSr
}>()
</script>
