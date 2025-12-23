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
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import type { XoHost } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: XoHost
}>()

const { t } = useI18n()

const manufacturerInfo = computed(
  () =>
    (host.bios_strings['system-manufacturer'] ?? '') +
    (host.bios_strings['system-product-name'] ? ` (${host.bios_strings['system-product-name']})` : '')
)

const coreSocketInfo = computed(() => {
  const cores = host.cpus.cores ?? 0
  const sockets = host.cpus.sockets ?? 0

  return `${cores} (${sockets})`
})
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
