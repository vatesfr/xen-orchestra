<template>
  <UiHeadBar icon="object:backup-archive">
    {{ t('backup-and-replication') }}
  </UiHeadBar>
  <TabList>
    <RouterLink
      v-slot="{ isExactActive, href }"
      :to="{ name: '/admin/backup-and-replication/backup-repositories' }"
      custom
    >
      <TabItem :active="isExactActive" :href tag="a">
        {{ t('backup-repositories') }}
      </TabItem>
    </RouterLink>
  </TabList>
</template>

<script lang="ts" setup>
import TabItem from '@core/components/tab/TabItem.vue'
import TabList from '@core/components/tab/TabList.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
