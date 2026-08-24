<template>
  <UiPanelCard class="user-groups-card">
    <UiPanelCardTitle size="medium" :label="t('groups')" :counter="userGroups.length" />

    <UiLinkList v-if="userGroups.length > 0" variant="vertical">
      <UiLink
        v-for="group in userGroups"
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
import type { FrontXoUser } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiLinkList from '@core/components/ui/link-list/UiLinkList.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { useI18n } from 'vue-i18n'

const { user } = defineProps<{
  user: FrontXoUser
}>()

const { t } = useI18n()

const { useGetGroupsByIds } = useXoGroupCollection()

const userGroups = useGetGroupsByIds(() => user.groups)
</script>
