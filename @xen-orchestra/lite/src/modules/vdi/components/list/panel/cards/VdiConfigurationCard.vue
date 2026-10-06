<template>
  <UiCard class="card-container">
    <UiCardTitle>
      {{ t('configuration') }}
    </UiCardTitle>
    <div class="content">
      <VdiFormatCardItem :format="vdi.sm_config['image-format']" />
      <VtsCardRowKeyValue>
        <template #key>
          {{ t('storage') }}
        </template>
        <template #value>
          <div v-if="vdiSr" class="storage">
            <!-- TODO: add the `to` prop once the SR page exists in XO Lite -->
            <UiLink size="small" icon="object:sr">
              {{ vdiSr.name_label }}
            </UiLink>
          </div>
        </template>
        <template v-if="vdiSr" #addons>
          <VtsCopyButton :value="vdiSr.name_label" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>
          {{ t('read-only') }}
        </template>
        <template #value>
          <VtsStatus :status="isReadOnly" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>
          {{ t('change-block-tracking') }}
        </template>
        <template #value>
          <VtsStatus :status="vdi.cbt_enabled" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>
          {{ t('bootable') }}
        </template>
        <template #value>
          <VtsStatus :status="isBootable" />
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import { VBD_MODE } from '@/libs/xen-api/xen-api.enums.ts'
import type { XenApiVbd, XenApiVdi } from '@/libs/xen-api/xen-api.types.ts'
import VdiFormatCardItem from '@/modules/vdi/components/list/panel/card-items/VdiFormatCardItem.vue'
import { useSrStore } from '@/stores/xen-api/sr.store.ts'
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
const vdiSr = computed(() => getSrByOpaqueRef(vdi.SR))
const isReadOnly = computed(() => vbd?.mode === VBD_MODE.RO)
const isBootable = computed(() => vbd?.bootable ?? false)
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
}
</style>
