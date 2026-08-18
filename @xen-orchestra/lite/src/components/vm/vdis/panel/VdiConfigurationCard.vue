<template>
  <UiCard class="card-container">
    <UiCardTitle>
      {{ t('configuration') }}
    </UiCardTitle>
    <div class="content">
      <VtsCardRowKeyValue>
        <template #key>{{ t('format') }}</template>
        <template #value>{{ vdiFormat }}</template>
        <template #addons>
          <VtsCopyButton :value="vdiFormat" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('storage') }}</template>
        <template #value>
          <div v-if="sr" class="storage">
            <!-- TODO: Add :to prop when SR page exists in XO Lite -->
            <UiLink size="small" icon="object:sr">
              {{ sr.name_label }}
            </UiLink>
          </div>
          <span v-else class="value" />
        </template>
        <template v-if="sr?.name_label" #addons>
          <VtsCopyButton :value="sr.name_label" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('change-block-tracking') }}</template>
        <template #value>
          <VtsStatus :status="vdi.cbt_enabled ? 'enabled' : 'disabled'" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue v-if="vbd">
        <template #key>{{ t('bootable') }}</template>
        <template #value>
          <VtsStatus :status="vbd.bootable ? 'enabled' : 'disabled'" />
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import type { XenApiVdi, XenApiVbd } from '@/libs/xen-api/xen-api.types.ts'
import { useSrStore } from '@/stores/xen-api/sr.store'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vdi, vbd } = defineProps<{
  vdi: XenApiVdi
  vbd?: XenApiVbd
}>()

const { t } = useI18n()

const { getByOpaqueRef: getSrByOpaqueRef } = useSrStore().subscribe()

const sr = computed(() => getSrByOpaqueRef(vdi.SR))

const vdiFormat = computed(() => {
  if (vdi.type === 'user') return 'VHD'
  if (vdi.type === 'system') return 'RAW'

  if (vdi.sm_config) {
    const type = vdi.sm_config.type || vdi.sm_config['vhd-type']
    if (type === 'vhd') return 'VHD'
    if (type === 'raw') return 'RAW'
  }

  return 'VHD'
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

  .storage {
    display: flex;
    gap: 0.8rem;
  }

  .value:empty::before {
    content: '-';
  }
}
</style>
