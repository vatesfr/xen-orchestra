<template>
  <UiCard>
    <UiTitle>
      {{ t('privilege:currently-applied-to') }}
    </UiTitle>
    <PrivilegeScopePreviewTable
      :resource
      :matches="appliedToMatches"
      :is-ready="appliedToIds !== undefined"
      :has-error="false"
    />
  </UiCard>
</template>

<script lang="ts" setup>
import PrivilegeScopePreviewTable from '@/modules/role/components/drawer/scope/PrivilegeScopePreviewTable.vue'
import { usePrivilegeAppliedToIds } from '@/modules/role/composables/use-privilege-applied-to-ids.composable.ts'
import type { PrivilegeSelectorMatch } from '@/modules/role/remote-resources/use-xo-privilege-selector-matches-collection.ts'
import type { SelectablePrivilegeResource } from '@/modules/role/utils/privilege-catalogue.util.ts'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import type { XoAclBasePrivilege } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { privilege } = defineProps<{
  privilege: XoAclBasePrivilege
  resource: SelectablePrivilegeResource
}>()

const { t } = useI18n()

const appliedToIds = usePrivilegeAppliedToIds(() => privilege)

const appliedToMatches = computed<PrivilegeSelectorMatch[]>(() =>
  (appliedToIds.value ?? []).map(id => ({ id, name: id }))
)
</script>
