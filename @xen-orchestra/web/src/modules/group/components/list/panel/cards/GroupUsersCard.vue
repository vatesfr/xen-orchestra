<template>
  <UiPanelCard class="group-users-card">
    <UiPanelCardTitle size="medium" :label="t('users')" :counter="groupUsers.length" />

    <UiLinkList v-if="groupUsers.length > 0" variant="vertical">
      <UiLink
        v-for="user in groupUsers"
        :key="user.id"
        icon="fa:circle-user"
        size="small"
        :to="{ name: '/admin/user-management/users', query: { id: user.id } }"
      >
        {{ user.name ?? user.email }}
      </UiLink>
    </UiLinkList>

    <VtsStateHero v-else type="no-data" format="card" horizontal size="extra-small">
      {{ t('no-user-attached') }}
    </VtsStateHero>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import type { FrontXoGroup } from '@/modules/group/remote-resources/use-xo-group-collection.ts'
import { useXoUserCollection } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiLinkList from '@core/components/ui/link-list/UiLinkList.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { group } = defineProps<{
  group: FrontXoGroup
}>()

const { t } = useI18n()

const { getUsersByIds } = useXoUserCollection()

const groupUsers = computed(() => getUsersByIds(group.users))
</script>
