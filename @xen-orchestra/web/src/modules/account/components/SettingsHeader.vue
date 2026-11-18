<template>
  <UiHeadBar icon="fa:gear">
    {{ t('settings') }}
  </UiHeadBar>
  <TabList :label="t('settings')">
    <RouterLink v-slot="{ isExactActive, href }" :to="{ name: '/settings/account' }" custom>
      <UiTabItem :active="isExactActive" :href tag="a">
        {{ t('account') }}
      </UiTabItem>
    </RouterLink>
    <RouterLink v-slot="{ isExactActive, href }" :to="{ name: '/settings/preferences' }" custom>
      <UiTabItem :active="isExactActive" :href tag="a">
        {{ t('preferences') }}
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
