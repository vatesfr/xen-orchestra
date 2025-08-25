<template>
  <UiHeadBar :icon="faSatellite">
    Xen Orchestra Appliance
    <template #actions>
      <UiLink to="/pool/connect" size="medium" :icon="faPlus">
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
    <TabItem disabled>{{ t('backups') }}</TabItem>
    <TabItem disabled>{{ t('tasks') }}</TabItem>
    <RouterLink v-slot="{ isExactActive, href }" to="/pools" custom>
      <TabItem :active="isExactActive" :href tag="a">{{ t('pools') }}</TabItem>
    </RouterLink>
    <TabItem disabled>{{ t('hosts') }}</TabItem>
    <TabItem disabled>{{ t('vms', 2) }}</TabItem>
  </TabList>
</template>

<script lang="ts" setup>
import TabItem from '@core/components/tab/TabItem.vue'
import TabList from '@core/components/tab/TabList.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { faPlus, faSatellite } from '@fortawesome/free-solid-svg-icons'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
