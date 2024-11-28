<template>
  <div class="host-network-view">
    <PifTable :pifs />
    <UiPanel class="network-panel">
      <template #header>
        <UiButton size="medium" variant="tertiary" accent="info" :left-icon="faEdit">
          {{ $t('edit') }}
        </UiButton>
        <UiButton size="medium" variant="tertiary" accent="danger" :left-icon="faTrash">
          {{ $t('delete') }}
        </UiButton>
      </template>
      <UiCard />
    </UiPanel>
  </div>
</template>

<script setup lang="ts">
import PifTable from '@/components/pif/PifTable.vue'
import { pifsByHost } from '@/fakePifStore'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiComplexIcon from '@core/components/ui/complex-icon/UiComplexIcon.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

const pifs = computed(() => pifsByHost.get('438aca0f-429c-4ae6-accc-93c306e636a0') ?? [])
</script>

<style scoped lang="postcss">
.host-network-view {
  display: flex;
  height: 100%;

  .network-panel {
    min-width: 400px;
    border-top: none;
  }
}
</style>
