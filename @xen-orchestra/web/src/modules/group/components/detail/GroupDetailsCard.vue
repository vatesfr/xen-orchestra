<template>
  <UiCard>
    <UiTitle>
      {{ t('group-details') }}
    </UiTitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('name')" :value="group.name" />
      <VtsTabularKeyValueRow :label="t('uuid')" :value="group.id" />
      <VtsTabularKeyValueRow :label="t('provider')" :value="group.provider" />
    </VtsTabularKeyValueList>
  </UiCard>
</template>

<script lang="ts" setup>
import type { FrontXoGroup } from '@/modules/group/remote-resources/use-xo-group-collection.ts'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  group: FrontXoGroup
}>()

const { t } = useI18n()
</script>
