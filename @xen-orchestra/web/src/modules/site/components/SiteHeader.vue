<template>
  <UiHeadBar icon="fa:satellite">
    {{ XOA_NAME }}
    <template #actions>
      <UiLink :to="{ name: '/pool/connect' }" size="medium" icon="fa:plus">
        {{ t('action:connect-pool') }}
      </UiLink>
    </template>
  </UiHeadBar>
  <TabList>
    <RouterLink v-slot="{ isExactActive, href }" :to="{ name: '/(site)/dashboard' }" custom>
      <UiTabItem :active="isExactActive" :href tag="a">
        {{ t('dashboard') }}
      </UiTabItem>
    </RouterLink>
    <RouterLink v-slot="{ isExactActive, href }" :to="{ name: '/(site)/backups' }" custom>
      <UiTabItem :active="isExactActive" :href tag="a">
        {{ t('backups') }}
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
import { XOA_NAME } from '@/shared/constants.ts'
import TabList from '@core/components/tab-list/TabList.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTabItem from '@core/components/ui/tab-item/UiTabItem.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
