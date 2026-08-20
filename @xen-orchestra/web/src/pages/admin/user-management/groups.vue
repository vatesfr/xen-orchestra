<template>
  <div class="groups">
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
</template>

<script setup lang="ts">
import GroupsTable from '@/modules/group/components/list/GroupsTable.vue'
import { useXoGroupCollection } from '@/modules/group/remote-resources/use-xo-group-collection.ts'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useHidePermanently } from '@core/packages/hide-permanently/use-hide-permanently.ts'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { groups, areGroupsReady, hasGroupFetchError } = useXoGroupCollection()

const [isInfoVisible, hideInfo] = useHidePermanently('what-is-a-group')
</script>

<style scoped lang="postcss">
.groups {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin: 0.8rem;

  .container {
    height: fit-content;
    gap: 4rem;
  }
}
</style>
