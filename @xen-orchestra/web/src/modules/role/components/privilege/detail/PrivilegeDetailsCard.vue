<template>
  <UiCard>
    <UiTitle>
      {{ t('privilege:details') }}
    </UiTitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('uuid')" :value="privilege.id" />
      <VtsTabularKeyValueRow :label="t('privilege:resource')" :value="privilege.resource" />
      <VtsTabularKeyValueRow :label="t('privilege:action')" :value="privilege.action" />
      <VtsTabularKeyValueRow :label="t('privilege:effect')">
        <template #value>
          <UiTag :accent="EFFECT_ACCENTS[privilege.effect]" variant="secondary">
            {{ t(privilege.effect) }}
          </UiTag>
        </template>
      </VtsTabularKeyValueRow>
    </VtsTabularKeyValueList>
  </UiCard>
</template>

<script lang="ts" setup>
import { EFFECT_ACCENTS } from '@/modules/role/utils/xo-privilege.util.ts'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import type { XoAclBasePrivilege } from '@vates/types'
import { useI18n } from 'vue-i18n'

defineProps<{
  privilege: XoAclBasePrivilege
}>()

const { t } = useI18n()
</script>
