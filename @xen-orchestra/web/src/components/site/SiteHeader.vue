<template>
  <UiHeadBar :icon="faSatellite">
    Xen Orchestra Appliance
    <template #actions>
      <UiButton :left-icon="faPlus" variant="secondary" accent="brand" size="medium" @click="goToNewVm()">
        {{ $t('new-vm') }}
      </UiButton>
    </template>
  </UiHeadBar>
  <TabList>
    <RouterLink v-slot="{ isExactActive, href }" to="/" custom>
      <TabItem :active="isExactActive" :href tag="a">
        {{ $t('dashboard') }}
      </TabItem>
    </RouterLink>
    <TabItem disabled>{{ $t('backups') }}</TabItem>
    <TabItem disabled>{{ $t('tasks') }}</TabItem>
    <TabItem disabled>{{ $t('pools') }}</TabItem>
    <TabItem disabled>{{ $t('hosts') }}</TabItem>
    <TabItem disabled>{{ $t('vms') }}</TabItem>
  </TabList>
</template>

<script lang="ts" setup>
import TabItem from '@core/components/tab/TabItem.vue'
import TabList from '@core/components/tab/TabList.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import { faPlus, faSatellite } from '@fortawesome/free-solid-svg-icons'
import { useRouter } from 'vue-router'

const router = useRouter()

const goToNewVm = () => router.push({ name: '/vm/new' })
</script>
