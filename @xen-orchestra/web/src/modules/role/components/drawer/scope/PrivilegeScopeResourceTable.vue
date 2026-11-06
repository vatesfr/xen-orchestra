<template>
  <PrivilegeScopeVmsTable v-if="resource === 'vm'" v-model:selected-ids="selectedIds" :visible-ids :readonly />
  <PrivilegeScopeHostsTable v-else-if="resource === 'host'" v-model:selected-ids="selectedIds" :visible-ids :readonly />
  <PrivilegeScopeSrsTable v-else-if="resource === 'sr'" v-model:selected-ids="selectedIds" :visible-ids :readonly />
  <PrivilegeScopeObjectsTable
    v-else
    :key="resource"
    v-model:selected-ids="selectedIds"
    :table-id="`privilege-scope-${resource}`"
    :objects="visibleObjects"
    :is-ready
    :has-error
    :empty-message
    :readonly
  />
</template>

<script lang="ts" setup>
import PrivilegeScopeHostsTable from '@/modules/role/components/drawer/scope/PrivilegeScopeHostsTable.vue'
import PrivilegeScopeObjectsTable from '@/modules/role/components/drawer/scope/PrivilegeScopeObjectsTable.vue'
import PrivilegeScopeSrsTable from '@/modules/role/components/drawer/scope/PrivilegeScopeSrsTable.vue'
import PrivilegeScopeVmsTable from '@/modules/role/components/drawer/scope/PrivilegeScopeVmsTable.vue'
import { usePrivilegeScopeObjects } from '@/modules/role/composables/use-privilege-scope-objects.composable.ts'
import type { SelectablePrivilegeResource } from '@/modules/role/utils/privilege-catalogue.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const {
  resource,
  visibleIds,
  readonly = false,
} = defineProps<{
  resource: SelectablePrivilegeResource
  visibleIds?: string[]
  readonly?: boolean
}>()

const selectedIds = defineModel<string[]>('selectedIds', { default: () => [] })

const { t } = useI18n()

const { objects, isReady, hasError } = usePrivilegeScopeObjects(() => resource)

const visibleObjects = computed(() =>
  visibleIds === undefined ? objects.value : objects.value.filter(object => visibleIds.includes(object.id))
)

const emptyMessage = computed(() => {
  if (resource === 'pool') {
    return t('no-pools-detected')
  }

  if (resource === 'backup-repository') {
    return t('no-backup-repository-detected')
  }

  return t('no-data')
})
</script>
