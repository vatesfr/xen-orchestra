<template>
  <VtsContentSidePanel class="groups">
    <div class="main">
      <GroupInfoAlert />
      <UiCard class="container">
        <GroupsTable :groups :busy="!areGroupsReady" :error="hasGroupFetchError" />
      </UiCard>
    </div>

    <GroupSidePanel :group="selectedGroup" @close="selectedGroup = undefined" />
  </VtsContentSidePanel>
</template>

<script setup lang="ts">
import GroupInfoAlert from '@/modules/group/components/GroupInfoAlert.vue'
import GroupsTable from '@/modules/group/components/list/GroupsTable.vue'
import GroupSidePanel from '@/modules/group/components/list/panel/GroupSidePanel.vue'
import { type FrontXoGroup, useXoGroupCollection } from '@/modules/group/remote-resources/use-xo-group-collection.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'

const { groups, getGroupById, areGroupsReady, hasGroupFetchError } = useXoGroupCollection()

const selectedGroup = useRouteQuery<FrontXoGroup | undefined>('id', {
  toData: id => getGroupById(id as FrontXoGroup['id']),
  toQuery: group => group?.id ?? '',
})
</script>

<style scoped lang="postcss">
.groups {
  .main {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    margin: 0.8rem;
  }

  .container {
    height: fit-content;
    gap: 4rem;
  }
}
</style>
