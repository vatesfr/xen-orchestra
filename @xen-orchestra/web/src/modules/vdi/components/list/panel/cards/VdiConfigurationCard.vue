<template>
  <UiCard class="card-container">
    <UiCardTitle>
      {{ t('configuration') }}
    </UiCardTitle>
    <div class="content">
      <VtsCardRowKeyValue>
        <template #key>
          {{ t('format') }}
        </template>
        <template #value>
          {{ format }}
        </template>
        <template #addons>
          <VtsCopyButton :value="format" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>
          {{ t('storage') }}
        </template>
        <template #value>
          <div v-if="vdiSr" class="storage">
            <UiLink size="small" :href="srHref" icon="object:sr">
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
          {{ t('change-block-tracking') }}
        </template>
        <template #value>
          <VtsStatus :status="vdi.cbt_enabled ?? false" />
        </template>
        <template v-if="vdi.cbt_enabled" #addons>
          <VtsCopyButton :value="t('enabled')" />
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection'
import { getVdiFormat } from '@/modules/vdi/utils/xo-vdi.util.ts'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vdi } = defineProps<{
  vdi: FrontXoVdi
}>()

const { t } = useI18n()

const { buildXo5Route } = useXoRoutes()

const { useGetSrById } = useXoSrCollection()

const format = computed(() => getVdiFormat(vdi.image_format))

const vdiSr = useGetSrById(() => vdi.$SR)

const srHref = computed(() => (vdiSr.value ? buildXo5Route(`/srs/${vdiSr.value.id}/general`) : undefined))
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
