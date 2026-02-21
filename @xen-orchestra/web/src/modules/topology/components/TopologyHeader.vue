<!-- eslint-disable @intlify/vue-i18n/no-raw-text -- prototype: i18n keys to be added later -->
<template>
  <TabList>
    <RouterLink v-slot="{ isActive, href }" :to="{ name: '/(site)/topology/infrastructure' }" custom>
      <TabItem :active="isActive" :href tag="a">Infrastructure</TabItem>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" :to="{ name: '/(site)/topology/networks' }" custom>
      <TabItem :active="isActive" :href tag="a">Networks</TabItem>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" :to="{ name: '/(site)/topology/storage' }" custom>
      <TabItem :active="isActive" :href tag="a">Storage</TabItem>
    </RouterLink>
  </TabList>
</template>

<script lang="ts" setup>
import TabItem from '@core/components/tab/TabItem.vue'
import TabList from '@core/components/tab/TabList.vue'
</script>
