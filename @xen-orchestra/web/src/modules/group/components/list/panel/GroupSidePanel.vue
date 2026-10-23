<template>
  <VtsSidePanel :has-selection="group !== undefined" @close="emit('close')">
    <template v-if="group && slots.actions" #actions>
      <slot name="actions" />
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
import type { FrontXoGroup } from '@/modules/group/remote-resources/use-xo-group-collection.ts'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'

const { group } = defineProps<{
  group?: FrontXoGroup
}>()

const emit = defineEmits<{
  close: []
}>()

const slots = defineSlots<{
  actions?(): any
}>()
</script>
