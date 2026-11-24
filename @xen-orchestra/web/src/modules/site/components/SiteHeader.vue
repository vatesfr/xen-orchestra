<template>
  <UiHeadBar icon="fa:satellite">
    {{ XOA_NAME }}
    <template #actions>
      <UiButton
        :busy="isConnectingPool"
        accent="brand"
        left-icon="fa:plus"
        size="medium"
        variant="tertiary"
        @click="openPoolConnectionDrawer()"
      >
        {{ t('action:connect-pool') }}
      </UiButton>
    </template>
  </UiHeadBar>
  <TabList :label="XOA_NAME">
    <RouterLink v-slot="{ isExactActive, href }" :to="{ name: '/(site)/dashboard' }" custom>
      <UiTabItem :active="isExactActive" :href tag="a">
        {{ t('dashboard') }}
      </UiTabItem>
    </RouterLink>
    <RouterLink v-slot="{ isExactActive, href }" :to="{ name: '/(site)/tasks' }" custom>
      <UiTabItem :active="isExactActive" :href tag="a">
        {{ t('tasks') }}
      </UiTabItem>
    </RouterLink>
    <RouterLink v-slot="{ isExactActive, href }" :to="{ name: '/(site)/pools' }" custom>
      <UiTabItem :active="isExactActive" :href tag="a">{{ t('pools') }}</UiTabItem>
    </RouterLink>
    <RouterLink v-slot="{ isExactActive, href }" :to="{ name: '/(site)/hosts' }" custom>
      <UiTabItem :active="isExactActive" :href tag="a">{{ t('hosts') }}</UiTabItem>
    </RouterLink>
    <RouterLink v-slot="{ isExactActive, href }" :to="{ name: '/(site)/vms' }" custom>
      <UiTabItem :active="isExactActive" :href tag="a">{{ t('vms') }}</UiTabItem>
    </RouterLink>
  </TabList>
</template>

<script lang="ts" setup>
import { usePoolConnection } from '@/modules/pool/composables/use-pool-connection.composable.ts'
import { XOA_NAME } from '@/shared/constants.ts'
import TabList from '@core/components/tab-list/TabList.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiTabItem from '@core/components/ui/tab-item/UiTabItem.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { openPoolConnectionDrawer, isConnectingPool } = usePoolConnection()
</script>
