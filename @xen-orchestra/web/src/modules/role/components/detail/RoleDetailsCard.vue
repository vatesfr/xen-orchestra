<template>
  <UiCard>
    <UiTitle>
      {{ t('role-details') }}
    </UiTitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('name')" :value="role.name" />
      <VtsTabularKeyValueRow :label="t('uuid')" :value="role.id" />
      <VtsTabularKeyValueRow :label="t('description')" :value="role.description" />
    </VtsTabularKeyValueList>
  </UiCard>
</template>

<script lang="ts" setup>
import type { FrontXoRole } from '@/modules/role/remote-resources/use-xo-role-collection.ts'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  role: FrontXoRole
}>()

const { t } = useI18n()
</script>
