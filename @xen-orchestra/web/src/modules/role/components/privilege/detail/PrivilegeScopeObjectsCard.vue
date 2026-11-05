<template>
  <UiCard>
    <UiTitle>
      {{ t('privilege:currently-applied-to') }}
    </UiTitle>
    <VtsStateHero v-if="hasAppliedToIdsError" type="error" format="card" size="small">
      {{ t('error-no-data') }}
    </VtsStateHero>
    <VtsStateHero v-else-if="appliedToIds === undefined" type="busy" format="card" size="small" />
    <VtsStateHero v-else-if="appliedToIds.length === 0" type="no-data" format="card" size="small">
      {{ t('privilege:no-object') }}
    </VtsStateHero>
    <PrivilegeScopeResourceTable v-else :resource :visible-ids="appliedToIds" readonly />
  </UiCard>
</template>

<script lang="ts" setup>
import PrivilegeScopeResourceTable from '@/modules/role/components/drawer/scope/PrivilegeScopeResourceTable.vue'
import { usePrivilegeAppliedToIds } from '@/modules/role/composables/use-privilege-applied-to-ids.composable.ts'
import type { SelectablePrivilegeResource } from '@/modules/role/utils/privilege-catalogue.util.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import type { XoAclBasePrivilege } from '@vates/types'
import { useI18n } from 'vue-i18n'

const { privilege } = defineProps<{
  privilege: XoAclBasePrivilege
  resource: SelectablePrivilegeResource
}>()

const { t } = useI18n()

const { appliedToIds, hasAppliedToIdsError } = usePrivilegeAppliedToIds(() => privilege)
</script>
