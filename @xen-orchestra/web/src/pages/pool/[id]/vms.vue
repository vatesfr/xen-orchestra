<template>
  <div class="vms" :class="{ mobile: uiStore.isMobile }">
    <UiCard class="container">
      <VmsTable :vms :is-ready="areVmsReady" :has-error="hasVmFetchError" />
    </UiCard>
    <VmsSidePanel v-if="selectedVm" :vm="selectedVm" @close="selectedVm = undefined" />
    <UiPanel v-else-if="!uiStore.isMobile">
      <VtsStateHero format="panel" type="no-selection" size="medium">
        {{ t('select-to-see-details') }}
      </VtsStateHero>
    </UiPanel>
  </div>
</template>

<script lang="ts" setup>
import VmsSidePanel from '@/components/vms/panel/VmsSidePanel.vue'
import VmsTable from '@/components/vms/VmsTable.vue'
import { useXoVmCollection } from '@/remote-resources/use-xo-vm-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { pool } = defineProps<{
  pool: XoPool
}>()

const uiStore = useUiStore()

const { t } = useI18n()

const { areVmsReady, vmsByPool, hasVmFetchError } = useXoVmCollection()

const vms = computed(() => vmsByPool.value.get(pool.id) ?? [])

const selectedVm = useRouteQuery<XoVm | undefined>('id', {
  toData: id => vms.value.find(vm => vm.id === id),
  toQuery: vm => vm?.id ?? '',
})
</script>

<style scoped lang="postcss">
.vms {
  &:not(.mobile) {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 40rem;
  }

  .container {
    height: fit-content;
    gap: 4rem;
    margin: 0.8rem;
  }
}
</style>
