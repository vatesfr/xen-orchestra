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
      <TabItem :active="isExactActive" :href tag="a">
        {{ t('dashboard') }}
      </TabItem>
    </RouterLink>
    <RouterLink v-slot="{ isExactActive, href }" :to="{ name: '/(site)/backups' }" custom>
      <TabItem :active="isExactActive" :href tag="a">
        {{ t('backups') }}
      </TabItem>
    </RouterLink>
    <RouterLink v-slot="{ isExactActive, href }" :to="{ name: '/(site)/tasks' }" custom>
      <TabItem :active="isExactActive" :href tag="a">
        {{ t('tasks') }}
      </TabItem>
    </RouterLink>
    <RouterLink v-slot="{ isExactActive, href }" :to="{ name: '/(site)/pools' }" custom>
      <TabItem :active="isExactActive" :href tag="a">{{ t('pools') }}</TabItem>
    </RouterLink>
    <RouterLink v-slot="{ isExactActive, href }" :to="{ name: '/(site)/hosts' }" custom>
      <TabItem :active="isExactActive" :href tag="a">{{ t('hosts') }}</TabItem>
    </RouterLink>
    <RouterLink v-slot="{ isExactActive, href }" :to="{ name: '/(site)/vms' }" custom>
      <TabItem :active="isExactActive" :href tag="a">{{ t('vms') }}</TabItem>
    </RouterLink>
    <RouterLink v-slot="{ isExactActive, href }" :to="{ name: '/(site)/topology' }" custom>
      <!-- eslint-disable-next-line @intlify/vue-i18n/no-raw-text -- prototype: i18n key to be added later -->
      <TabItem :active="isExactActive" :href tag="a">Topology</TabItem>
    </RouterLink>
  </TabList>
</template>

<script lang="ts" setup>
import { XOA_NAME } from '@/shared/constants.ts'
import TabItem from '@core/components/tab/TabItem.vue'
import TabList from '@core/components/tab/TabList.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
