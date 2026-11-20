<template>
  <div class="scroll-container">
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
  </div>
</template>

<script setup lang="ts">
import StorageRepositoryCustomFields from '@/modules/storage-repository/components/general/StorageRepositoryCustomFields.vue'
import StorageRepositoryGeneralInformation from '@/modules/storage-repository/components/general/StorageRepositoryGeneralInformation.vue'
import StorageRepositoryPbdDetails from '@/modules/storage-repository/components/general/StorageRepositoryPbdDetails.vue'
import StorageRepositorySpace from '@/modules/storage-repository/components/general/StorageRepositorySpace.vue'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import VtsColumn from '@core/components/column/VtsColumn.vue'
import VtsColumns from '@core/components/columns/VtsColumns.vue'

defineProps<{ sr: FrontXoSr }>()
</script>

<style lang="postcss" scoped>
.scroll-container {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
</style>
