<template>
  <UiHeadBar icon="object:organization">
    {{ t('user-management') }}
  </UiHeadBar>
  <TabList>
    <RouterLink v-slot="{ isExactActive, href }" :to="{ name: '/admin/user-management/users' }" custom>
      <UiTabItem :active="isExactActive" :href tag="a">
        {{ t('users') }}
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
