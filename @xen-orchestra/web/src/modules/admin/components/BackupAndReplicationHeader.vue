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
      <UiTabItem :active="isExactActive" :href tag="a">
        {{ t('backup-repositories') }}
      </UiTabItem>
    </RouterLink>
  </TabList>
</template>

<script lang="ts" setup>
import TabList from '@core/components/tab-list/TabList.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiTabItem from '@core/components/ui/tab-item/UiTabItem.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
