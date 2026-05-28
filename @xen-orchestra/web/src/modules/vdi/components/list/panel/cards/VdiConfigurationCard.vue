<template>
  <UiCard class="card-container">
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
          <VtsStatus :status="vdi.cbt_enabled ?? false" />
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
import { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import VdiFormatCardItem from '@/modules/vdi/components/list/panel/card-items/VdiFormatCardItem.vue'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vdi, vm } = defineProps<{
  vdi: FrontXoVdi
  vm: FrontXoVm
}>()

const { t } = useI18n()

const { buildXo5Route } = useXoRoutes()

const { useGetSrById } = useXoSrCollection()
const { useGetVbdsByIds } = useXoVbdCollection()

const vdiSr = useGetSrById(() => vdi.$SR)

const srHref = computed(() => (vdiSr.value ? buildXo5Route(`/srs/${vdiSr.value.id}/general`) : undefined))

const vbds = useGetVbdsByIds(() => vdi.$VBDs)

const vbd = computed(() => vbds.value.find(vbd => vbd.VM === vm.id))

const isReadOnly = computed(() => vbd.value?.read_only ?? false)

const isBootable = computed(() => vbd.value?.bootable ?? false)
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
