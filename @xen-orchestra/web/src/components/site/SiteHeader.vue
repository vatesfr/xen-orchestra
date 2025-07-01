<template>
  <UiHeadBar :icon="faSatellite">
    Xen Orchestra Appliance
    <template #actions>
      <RouterLink to="/pool/connect">
        <UiButton :left-icon="faPlus" variant="secondary" accent="brand" size="medium">
          {{ t('connect-pool') }}
        </UiButton>
      </RouterLink>
    </template>
  </UiHeadBar>
  <TabList>
    <RouterLink v-slot="{ isExactActive, href }" to="/" custom>
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
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import { faPlus, faSatellite } from '@fortawesome/free-solid-svg-icons'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
