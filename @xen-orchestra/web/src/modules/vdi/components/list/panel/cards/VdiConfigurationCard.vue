<template>
  <UiPanelCard class="vdi-configuration-card">
    <UiCardTitle>
      {{ t('configuration') }}
    </UiCardTitle>
    <div class="content">
      <VdiFormatCardItem :format="vdi.image_format" />
      <VtsCardRowKeyValue>
        <template #key>
          {{ t('storage') }}
        </template>
        <template #value>
          <div v-if="vdiSr" class="storage">
            <UiLink size="small" :to="srPageLocation" icon="object:sr">
              {{ vdiSr.name_label }}
            </UiLink>
          </div>
        </template>
        <template v-if="vdiSr" #addons>
          <VtsCopyButton :value="vdiSr.name_label" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue v-if="vbd">
        <template #key>
          {{ t('read-only') }}
        </template>
        <template #value>
          <VtsStatus :status="vbd.read_only" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>
          {{ t('change-block-tracking') }}
        </template>
        <template #value>
          <VtsStatus :status="vdi.cbt_enabled ?? false" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue v-if="vbd">
        <template #key>
          {{ t('bootable') }}
        </template>
        <template #value>
          <VtsStatus :status="vbd.bootable" />
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiPanelCard>
</template>

<script setup lang="ts">
import { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { getSrPageLocation } from '@/modules/storage-repository/utils/xo-sr.util.ts'
import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import VdiFormatCardItem from '@/modules/vdi/components/list/panel/card-items/VdiFormatCardItem.vue'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVdiSnapshot } from '@/modules/vdi/remote-resources/use-xo-vdi-snapshot-collection.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import { SR_SCOPE_TYPE, type SrScope } from '@core/types/storage-repository.type.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vdi, srScope = { type: SR_SCOPE_TYPE.POOL } } = defineProps<{
  vdi: FrontXoVdi | FrontXoVdiSnapshot
  vbd?: FrontXoVbd
  srScope?: SrScope
}>()

const { t } = useI18n()

const { useGetSrById } = useXoSrCollection()

const vdiSr = useGetSrById(() => vdi.$SR)

const srPageLocation = computed(() => (vdiSr.value ? getSrPageLocation(vdiSr.value, srScope) : undefined))
</script>

<style scoped lang="postcss">
.vdi-configuration-card {
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
