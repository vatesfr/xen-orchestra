<template>
  <UiPanelCard class="v2v-destination-vm-card">
    <UiPanelCardTitle size="medium" :label="t('destination-vm')" />
    <div class="vm">
      <UiLink size="medium" :icon="vm.icon" :to="{ name: '/vm/[id]/dashboard', params: { id: vm.id } }">
        {{ vm.name }}
      </UiLink>
      <VtsInlineParts separator="bullet" class="typo-body-regular-small">
        <span>{{ t('pool-named', { name: poolName }) }}</span>
        <span>{{ vm.powerLabel }}</span>
        <span>{{ t('v2v:start-blocked-partial') }}</span>
      </VtsInlineParts>
    </div>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import type { V2vDestinationVm } from '@/modules/v2v/types/v2v-destination-vm.type.ts'
import VtsInlineParts from '@core/components/inline-parts/VtsInlineParts.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  vm: V2vDestinationVm
  poolName: string
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.v2v-destination-vm-card {
  .vm {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
