<template>
  <VtsDeleteModal>
    <template #title>
      {{ title }}
    </template>

    <template #confirm>
      {{ t(`action:delete-networks`, { n: count }) }}
    </template>
  </VtsDeleteModal>
</template>

<script lang="ts" setup>
import type { NetworkType } from '@/modules/network/utils/xo-network.util.ts'
import VtsDeleteModal from '@core/components/modal/VtsDeleteModal.vue'
import { useMapper } from '@core/packages/mapper/use-mapper.ts'
import { useI18n } from 'vue-i18n'

export type NetworkDeleteModalProps = {
  type?: NetworkType
  count: number
}

const { type = 'physical', count } = defineProps<NetworkDeleteModalProps>()

const { t } = useI18n()

const title = useMapper(
  () => type,
  {
    physical: t('n-networks', { n: count }),
    bonded: t('n-bonded-networks', { n: count }),
    internal: t('n-internal-networks', { n: count }),
  },
  'physical'
)
</script>
