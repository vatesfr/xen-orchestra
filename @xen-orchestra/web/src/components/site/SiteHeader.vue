<template>
  <UiHeadBar icon="fa:satellite">
    {{ XOA_NAME }}
    <template #actions>
      <UiLink to="/pool/connect" size="medium" icon="fa:plus">
        {{ t('connect-pool') }}
      </UiLink>
    </template>
  </UiHeadBar>
  <TabList>
    <RouterLink v-slot="{ isExactActive, href }" :to="{ name: '/(site)/dashboard' }" custom>
      <TabItem :active="isExactActive" :href tag="a">
        {{ t('dashboard') }}
      </TabItem>
    </RouterLink>
    <RouterLink v-slot="{ isExactActive, href }" to="/backups" custom>
      <TabItem :active="isExactActive" :href tag="a">
        {{ t('backup', 0) }}
      </TabItem>
    </RouterLink>
    <TabItem disabled>{{ t('task', 0) }}</TabItem>
    <RouterLink v-slot="{ isExactActive, href }" to="/pools" custom>
      <TabItem :active="isExactActive" :href tag="a">{{ t('pool', 0) }}</TabItem>
    </RouterLink>
    <RouterLink v-slot="{ isExactActive, href }" to="/hosts" custom>
      <TabItem :active="isExactActive" :href tag="a">{{ t('host', 0) }}</TabItem>
    </RouterLink>
    <RouterLink v-slot="{ isExactActive, href }" to="/vms" custom>
      <TabItem :active="isExactActive" :href tag="a">{{ t('vm', 0) }}</TabItem>
    </RouterLink>
  </TabList>
</template>

<script lang="ts" setup>
import { XOA_NAME } from '@/constants'
import TabItem from '@core/components/tab/TabItem.vue'
import TabList from '@core/components/tab/TabList.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
