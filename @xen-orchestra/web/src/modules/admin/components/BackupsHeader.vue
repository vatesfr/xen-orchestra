<template>
  <UiHeadBar icon="object:organization">
    {{ t('backups') }}
  </UiHeadBar>
  <TabList>
    <RouterLink v-slot="{ isExactActive, href }" :to="{ name: '/admin/backups/brs' }" custom>
      <TabItem :active="isExactActive" :href tag="a">
        {{ t('brs') }}
      </TabItem>
    </RouterLink>
  </TabList>
</template>

<script lang="ts" setup>
import TabItem from '@xen-orchestra/web-core/components/tab/TabItem.vue'
import TabList from '@xen-orchestra/web-core/components/tab/TabList.vue'
import UiHeadBar from '@xen-orchestra/web-core/components/ui/head-bar/UiHeadBar.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
