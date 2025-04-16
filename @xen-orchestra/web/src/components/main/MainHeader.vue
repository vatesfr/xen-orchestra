<template>
  <UiHeadBar>
    <LogoTextOnly class="logo" />
  </UiHeadBar>

  <TabList>
    <RouterLink v-slot="{ isActive, href }" to="/dashboard" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ $t('dashboard') }}
      </TabItem>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" to="/tasks" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ $t('tasks') }}
      </TabItem>
    </RouterLink>
    <TabItem disabled>{{ $t('pools') }}</TabItem>
    <TabItem disabled>{{ $t('hosts') }}</TabItem>
    <TabItem disabled>{{ $t('vms', 0) }}</TabItem>
  </TabList>
</template>

<script lang="ts" setup>
import LogoTextOnly from '@/components/LogoTextOnly.vue'
import TabItem from '@core/components/tab/TabItem.vue'
import TabList from '@core/components/tab/TabList.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
</script>

<style lang="postcss" scoped>
.logo {
  height: 1.6rem;
}
</style>
