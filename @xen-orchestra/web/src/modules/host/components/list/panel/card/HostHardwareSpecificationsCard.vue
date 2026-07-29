<template>
  <UiCard class="card-container">
    <UiCardTitle>
      {{ t('hardware-specifications') }}
    </UiCardTitle>
    <div class="content">
      <VtsCardRowKeyValue>
        <template #key>{{ t('manufacturer-info') }}</template>
        <template #value>{{ manufacturerInfo }}</template>
        <template #addons>
          <VtsCopyButton :value="manufacturerInfo" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('core-socket') }}</template>
        <template #value>{{ coreSocketInfo }}</template>
        <template #addons>
          <VtsCopyButton :value="coreSocketInfo" />
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { getHostCoreSocketInfo, getHostManufacturerInfo } from '@/modules/host/utils/xo-host.util.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: FrontXoHost
}>()

const { t } = useI18n()

const manufacturerInfo = computed(() => getHostManufacturerInfo(host))

const coreSocketInfo = computed(() => getHostCoreSocketInfo(host))
</script>

<style scoped lang="postcss">
.card-container {
  gap: 1.6rem;

  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
