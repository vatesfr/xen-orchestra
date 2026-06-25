<template>
  <UiCard>
    <UiTitle>
      {{ t('space') }}
    </UiTitle>
    <VtsTabularKeyValueList v-if="displayedVdi">
      <VtsTabularKeyValueRow :label="t('used-space-on-sr')" :value="formatSizeSpace(displayedVdi.usage)" />
      <VtsTabularKeyValueRow
        :label="t('free-space-on-sr')"
        :value="formatSizeSpace(displayedVdi.size - displayedVdi.usage)"
      />
      <VtsTabularKeyValueRow :label="t('allocated-space')" :value="formatSizeSpace(displayedVdi.size)" />
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
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vdi, vdiSnapshot } = defineProps<{ vdi?: FrontXoVdi; vdiSnapshot?: FrontXoVdiSnapshot }>()

const { t } = useI18n()

const displayedVdi = computed(() => vdi ?? vdiSnapshot)

const formatSizeSpace = (bytes: number) => formatSize(bytes, 2)
</script>
