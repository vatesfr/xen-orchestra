<template>
  <UiCard>
    <UiTitle>
      {{ t('space') }}
    </UiTitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('used-space-on-sr')" :value="formatSizeSpace(vdi.usage)" />
      <VtsTabularKeyValueRow :label="t('free-space-on-sr')" :value="formatSizeSpace(vdi.size - vdi.usage)" />
      <VtsTabularKeyValueRow :label="t('allocated-space')" :value="formatSizeSpace(vdi.size)" />
    </VtsTabularKeyValueList>
  </UiCard>
</template>

<script setup lang="ts">
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import humanFormat from 'human-format'
import { useI18n } from 'vue-i18n'

const { vdi } = defineProps<{ vdi: FrontXoVdi }>()

const formatSizeSpace = (bytes: number) => humanFormat.bytes(bytes, { decimals: 2 })
const { t } = useI18n()
</script>
