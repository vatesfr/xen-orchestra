<template>
  <UiCard>
    <UiTitle>
      {{ t('privilege:scope') }}
    </UiTitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('privilege:scope-type')" :value="scopeTypeLabels[scopeType]" />
      <VtsTabularKeyValueRow
        v-if="scopeType === 'dynamic-selection' && privilege.selector !== undefined"
        :label="t('privilege:selector')"
      >
        <template #value>
          <UiLogEntryViewer :content="privilege.selector" size="medium" accent="info" />
        </template>
      </VtsTabularKeyValueRow>
    </VtsTabularKeyValueList>
  </UiCard>
</template>

<script lang="ts" setup>
import { usePrivilegeScopeTypeLabels } from '@/modules/role/composables/use-privilege-scope-type-labels.composable.ts'
import { getPrivilegeScopeType } from '@/modules/role/utils/privilege-scope.util.ts'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLogEntryViewer from '@core/components/ui/log-entry-viewer/UiLogEntryViewer.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import type { XoAclBasePrivilege } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { privilege } = defineProps<{
  privilege: XoAclBasePrivilege
}>()

const { t } = useI18n()

const scopeTypeLabels = usePrivilegeScopeTypeLabels()

const scopeType = computed(() => getPrivilegeScopeType(privilege.selector))
</script>
