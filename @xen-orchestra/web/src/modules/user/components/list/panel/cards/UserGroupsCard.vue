<template>
  <UiCard class="card-container">
    <UiCardTitle>
      <div class="title">
        {{ t('groups') }}
        <UiCounter :value="userGroups.length" accent="neutral" size="small" variant="primary" />
      </div>
    </UiCardTitle>

    <div v-if="userGroups.length > 0">
      <template v-for="group in userGroups" :key="group.id">
        <div class="group-list">
          <VtsIcon size="medium" name="table:group" />
          <VtsCodeSnippet :content="group.name" />
        </div>
      </template>
    </div>

    <VtsStateHero v-else type="no-data" format="card" horizontal size="extra-small">
      {{ t('no-group-attached') }}
    </VtsStateHero>
  </UiCard>
</template>

<script lang="ts" setup>
import { useXoGroupCollection } from '@/modules/group/remote-ressources/use-xo-group-collection.ts'
import type { FrontXoUser } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import VtsCodeSnippet from '@core/components/code-snippet/VtsCodeSnippet.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import { useI18n } from 'vue-i18n'

const { user } = defineProps<{
  user: FrontXoUser
}>()

const { useGetGroupsByIds } = useXoGroupCollection()

const userGroups = useGetGroupsByIds(() => user.groups)

const { t } = useI18n()
</script>

<style scoped lang="postcss">
.card-container {
  gap: 1.6rem;

  .title {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }

  .group-list {
    display: flex;
    gap: 0.6rem;
    margin-block: 0.6rem;
  }
}
</style>
