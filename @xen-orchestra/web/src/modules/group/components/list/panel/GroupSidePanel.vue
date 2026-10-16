<template>
  <VtsSidePanel :has-selection="group !== undefined" @close="emit('close')">
    <template v-if="group" #actions>
      <slot name="actions">
        <VtsDeleteButton
          :disabled="!canDeleteGroups"
          :busy="isDeletingGroups"
          :tooltip="deleteGroupsErrorMessage ?? false"
          @click="deleteGroups()"
        />
      </slot>
    </template>
    <template v-if="group" #default>
      <GroupInfosCard :group />
      <GroupUsersCard :group />
      <GroupRolesCard :group />
    </template>
  </VtsSidePanel>
</template>

<script setup lang="ts">
import GroupInfosCard from '@/modules/group/components/list/panel/cards/GroupInfosCard.vue'
import GroupRolesCard from '@/modules/group/components/list/panel/cards/GroupRolesCard.vue'
import GroupUsersCard from '@/modules/group/components/list/panel/cards/GroupUsersCard.vue'
import { useGroupDelete } from '@/modules/group/composables/use-group-delete.composable.ts'
import type { FrontXoGroup } from '@/modules/group/remote-resources/use-xo-group-collection.ts'
import VtsDeleteButton from '@core/components/delete-button/VtsDeleteButton.vue'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'

const { group } = defineProps<{
  group?: FrontXoGroup
}>()

const emit = defineEmits<{
  close: []
}>()

defineSlots<{
  actions?(): any
}>()

const { deleteGroups, canDeleteGroups, isDeletingGroups, deleteGroupsErrorMessage } = useGroupDelete(() =>
  group !== undefined ? [group] : []
)
</script>
