<template>
  <div class="networks">
    <UiCard class="container">
      <VmVifsTable :vifs />
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import VmVifsTable from '@/components/vm/VmVifsTable.vue'
import { useVifStore } from '@/stores/xo-rest-api/vif.store.ts'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useArrayFilter } from '@vueuse/shared'
import { useRoute } from 'vue-router/auto'

const { records } = useVifStore().subscribe()
const route = useRoute<'/vm/[id]'>()
const vifs = useArrayFilter(records, vif => vif.$VM === route.params.id)
</script>

<style scoped lang="postcss">
.networks {
  .container {
    height: fit-content;
    margin: 0.8rem;
    gap: 4rem;
  }
}
</style>
