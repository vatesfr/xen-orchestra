<template>
  <UiCard>
    <UiCardTitle>{{ t('destination-vm') }}</UiCardTitle>
    <div class="vm">
      <UiLink size="medium" :icon="vm.icon" :to="{ name: '/vm/[id]/dashboard', params: { id: vm.id } }">
        {{ vm.name }}
      </UiLink>
      <InlineParts class="typo-body-regular-small">
        <span>{{ t('pool-named', { name: poolName }) }}</span>
        <span>{{ vm.powerLabel }}</span>
        <span>{{ t('v2v:start-blocked-partial') }}</span>
      </InlineParts>
    </div>
    <UiInfo accent="info" wrap>{{ t('v2v:no-bak-info', { tag: V2V_PARTIAL_IMPORT_TAG }) }}</UiInfo>
  </UiCard>
</template>

<script lang="ts" setup>
import type { V2vDestinationVm } from '@/modules/v2v/composables/use-v2v-resumed-vm.composable.ts'
import InlineParts from '@/shared/components/InlineParts.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { V2V_PARTIAL_IMPORT_TAG } from '@vates/types'
import { useI18n } from 'vue-i18n'

defineProps<{
  vm: V2vDestinationVm
  poolName: string
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.vm {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
</style>
