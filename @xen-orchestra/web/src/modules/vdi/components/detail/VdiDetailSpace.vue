<template>
  <UiCard>
    <UiTitle>
      {{ t('space') }}
    </UiTitle>
    <VtsTabularKeyValueList v-if="vdi">
      <VtsTabularKeyValueRow :label="t('used-space-on-sr')" :value="formatSizeSpace(vdi.usage)" />
      <VtsTabularKeyValueRow :label="t('free-space-on-sr')" :value="formatSizeSpace(vdi.size - vdi.usage)" />
      <VtsTabularKeyValueRow :label="t('allocated-space')" :value="formatSizeSpace(vdi.size)" />
    </VtsTabularKeyValueList>
    <VtsTabularKeyValueList v-if="snapshot">
      <VtsTabularKeyValueRow :label="t('used-space-on-sr')" :value="formatSizeSpace(snapshot.usage)" />
      <VtsTabularKeyValueRow :label="t('free-space-on-sr')" :value="formatSizeSpace(snapshot.size - snapshot.usage)" />
      <VtsTabularKeyValueRow :label="t('allocated-space')" :value="formatSizeSpace(snapshot.size)" />
    </VtsTabularKeyValueList>
  </UiCard>
</template>

<script setup lang="ts">
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVdiSnapshot } from '@/modules/vdi/remote-resources/use-xo-vdi-snapshot-collection.ts'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { formatSize } from '@core/utils/size.util.ts'
import { useI18n } from 'vue-i18n'

defineProps<{ vdi?: FrontXoVdi; snapshot?: FrontXoVdiSnapshot }>()

const formatSizeSpace = (bytes: number) => formatSize(bytes, 2)
const { t } = useI18n()
</script>
