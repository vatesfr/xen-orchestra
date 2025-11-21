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
          {{ imageFormat }}
        </template>
        <template #addons>
          <VtsCopyButton :value="imageFormat" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>
          {{ t('storage') }}
        </template>
        <template #value>
          <div class="storage">
            <VtsObjectIcon type="sr" state="muted" size="medium" />
            <UiLink v-if="vdiSrName" size="small" :href="`/#/srs/${vdiSrId}/general`">
              {{ vdiSrName }}
            </UiLink>
          </div>
        </template>
        <template v-if="vdiSrName" #addons>
          <VtsCopyButton :value="vdiSrName" />
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
import { useXoSrCollection } from '@/remote-resources/use-xo-sr-collection.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsObjectIcon from '@core/components/object-icon/VtsObjectIcon.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import type { XoVdi } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vdi } = defineProps<{
  vdi: XoVdi
}>()

const { t } = useI18n()

const { srs } = useXoSrCollection()

const imageFormat = computed(() => vdi.image_format?.toUpperCase() ?? t('vhd'))

const vdiSrName = computed(() => {
  if (!vdi.$SR) {
    return undefined
  }

  return srs.value.find(sr => sr.id === vdi.$SR)?.name_label
})

const srId = computed(() => {
  if (!vdi.$SR) {
    return undefined
  }

  return srs.value.find(sr => sr.id === vdi.$SR)
})

const vdiSrId = computed(() => srId.value?.id)
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
