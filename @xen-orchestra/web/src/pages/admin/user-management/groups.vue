<template>
  <VtsContentSidePanel class="groups">
    <div class="main">
      <UiAlert v-if="isInfoVisible" accent="info" close @close="hideInfo">
        <span class="typo-body-bold">{{ t('group:what-is-a-group?') }}</span>
        <template #description>
          <span class="typo-body-regular">{{ t('group:what-is-a-group-description') }}</span>
        </template>
      </UiAlert>
      <UiCard class="container">
        <GroupsTable :groups :busy="!areGroupsReady" :error="hasGroupFetchError" />
      </UiCard>
    </div>

    <GroupSidePanel :group="selectedGroup" @close="selectedGroup = undefined" />
  </VtsContentSidePanel>
</template>

<script setup lang="ts">
import GroupsTable from '@/modules/group/components/list/GroupsTable.vue'
import GroupSidePanel from '@/modules/group/components/list/panel/GroupSidePanel.vue'
import { type FrontXoGroup, useXoGroupCollection } from '@/modules/group/remote-resources/use-xo-group-collection.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useHidePermanently } from '@core/packages/hide-permanently/use-hide-permanently.ts'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { groups, getGroupById, areGroupsReady, hasGroupFetchError } = useXoGroupCollection()

const [isInfoVisible, hideInfo] = useHidePermanently('what-is-a-group')

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
