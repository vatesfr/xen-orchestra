<template>
  <UiPanelCard class="role-groups-card">
    <UiPanelCardTitle size="medium" :label="t('groups')" :counter="areGroupsReady ? roleGroups.length : undefined" />

    <VtsStateHero v-if="hasGroupFetchError" type="error" format="card" horizontal size="extra-small">
      {{ t('error-no-data') }}
    </VtsStateHero>

    <VtsStateHero v-else-if="!areGroupsReady" type="busy" format="card" horizontal size="extra-small" />

    <UiLinkList
      v-else-if="roleGroups.length > 0"
      variant="vertical"
      :visible-items="5"
      :total-items="roleGroups.length"
    >
      <UiLink
        v-for="group of roleGroups"
        :key="group.id"
        icon="table:group"
        size="small"
        :to="{ name: '/admin/user-management/groups', query: { id: group.id } }"
      >
        {{ group.name }}
      </UiLink>
    </UiLinkList>

    <VtsStateHero v-else type="no-data" format="card" horizontal size="extra-small">
      {{ t('no-group-attached') }}
    </VtsStateHero>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import { useXoGroupCollection } from '@/modules/group/remote-resources/use-xo-group-collection.ts'
import type { FrontXoRole } from '@/modules/role/remote-resources/use-xo-role-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiLinkList from '@core/components/ui/link-list/UiLinkList.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { useI18n } from 'vue-i18n'

const { role } = defineProps<{
  role: FrontXoRole
}>()

const { t } = useI18n()

const { useGetGroupsByIds, areGroupsReady, hasGroupFetchError } = useXoGroupCollection()

const roleGroups = useGetGroupsByIds(() => role.groupIds)
</script>
