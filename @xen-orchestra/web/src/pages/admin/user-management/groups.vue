<template>
  <VtsContentSidePanel class="groups">
    <div class="main">
      <GroupInfoAlert />
      <UiCard class="container">
        <GroupsTable :groups :busy="!areGroupsReady" :error="hasGroupFetchError">
          <template #title-actions>
            <UiButton variant="primary" accent="brand" size="medium" left-icon="fa:plus" @click="createGroup()">
              {{ t('new') }}
            </UiButton>
          </template>
        </GroupsTable>
      </UiCard>
    </div>

    <GroupSidePanel :group="selectedGroup" @close="selectedGroup = undefined" />
  </VtsContentSidePanel>
</template>

<script setup lang="ts">
import GroupInfoAlert from '@/modules/group/components/GroupInfoAlert.vue'
import GroupsTable from '@/modules/group/components/list/GroupsTable.vue'
import GroupSidePanel from '@/modules/group/components/list/panel/GroupSidePanel.vue'
import { useGroupCreate } from '@/modules/group/composables/use-group-create.composable.ts'
import { type FrontXoGroup, useXoGroupCollection } from '@/modules/group/remote-resources/use-xo-group-collection.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { groups, getGroupById, areGroupsReady, hasGroupFetchError } = useXoGroupCollection()

const { createGroup } = useGroupCreate()

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
